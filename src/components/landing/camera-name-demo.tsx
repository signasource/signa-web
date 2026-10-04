"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { cn } from "@/lib/utils";
import { LisaGlbViewer } from "@/components/landing/lisa-glb-viewer";
import {
  LetterVerifier,
  parseName,
  visibleRegion,
  MAX_NAME_LENGTH,
  type Point,
} from "@/lib/alphabet-recognizer";
import type { RecognizerClient } from "@/lib/alphabet-client";

type Stage = "setup" | "loading" | "practice" | "complete" | "error";
type Phase = "idle" | "capturing" | "hit";

/** Frames go to the recognizer at this width, the same as signa-ml's demo page sends its server. */
const FRAME_WIDTH = 480;
/** The face reference (pose) is refreshed one frame out of this many: the head moves slowly. */
const FRAMES_PER_POSE = 5;
const COOLDOWN_MS = 1800;
/** Recognition waits for Lisa's signs to be loaded (see SignPip), but never longer than this. */
const PRELOAD_MAX_MS = 10000;
const HIT_MS = 1300;

const HAND_LINKS: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  [0, 17],
];
const TIPS = new Set([4, 8, 12, 16, 20]);

// The recognizer (MediaPipe + the classifier, in a Web Worker) is started once per page and reused
// when the preview is opened again.
let enginePromise: Promise<RecognizerClient> | null = null;
function getEngine(): Promise<RecognizerClient> {
  enginePromise ??= import("@/lib/alphabet-client")
    .then((m) => m.createRecognizerClient())
    .catch((e: unknown) => {
      enginePromise = null;
      throw e;
    });
  return enginePromise;
}

function cssColor(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function CameraNameDemo({ className }: { className?: string }) {
  const [stage, setStage] = useState<Stage>("setup");
  const [input, setInput] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [filled, setFilled] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [signsReady, setSignsReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const engineRef = useRef<RecognizerClient | null>(null);
  // What the animation loop reads every frame without re-rendering.
  const live = useRef({
    name: "",
    filled: 0,
    running: true,
    skeleton: true,
    signsReady: false,
    phase: "idle" as Phase,
    cooldownUntil: 0,
    target: null as Point[] | null,
    drawn: null as Point[] | null,
  });

  const target = name[filled] ?? "";
  useEffect(() => {
    Object.assign(live.current, {
      name,
      filled,
      running,
      skeleton: showSkeleton,
      signsReady,
      phase,
    });
  }, [name, filled, running, showSkeleton, signsReady, phase]);

  // Lisa's signs for the whole name load while the visitor gets ready; recognition starts when
  // they are in (or after PRELOAD_MAX_MS, so a slow network never blocks the exercise).
  const letters = [...new Set(name.split(""))];
  const onSignsLoaded = useCallback(() => setSignsReady(true), []);
  useEffect(() => {
    if (stage !== "practice") return;
    const t = setTimeout(() => setSignsReady(true), PRELOAD_MAX_MS);
    return () => clearTimeout(t);
  }, [stage]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  async function start(e: FormEvent) {
    e.preventDefault();
    const supported = engineRef.current?.labels;
    const parsed = parseName(input, supported ?? []);
    if (!parsed.name) {
      setWarning("Escribí tu nombre para empezar.");
      return;
    }
    if (supported && parsed.unsupported.length) {
      setWarning(`Por ahora no podemos reconocer la ${parsed.unsupported.join(" ni la ")}.`);
      return;
    }
    setWarning(null);
    setError(null);
    setStage("loading");
    try {
      const [stream, engine] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 } },
          audio: false,
        }),
        getEngine(),
      ]);
      const unsupported = parseName(parsed.name, engine.labels).unsupported;
      if (unsupported.length) {
        stream.getTracks().forEach((t) => t.stop());
        setWarning(`Por ahora no podemos reconocer la ${unsupported.join(" ni la ")}.`);
        setStage("setup");
        return;
      }
      engineRef.current = engine;
      streamRef.current = stream;
      setName(parsed.name);
      setFilled(0);
      setPhase("idle");
      setRunning(true);
      setSignsReady(false);
      setStage("practice");
    } catch (err) {
      const denied = err instanceof DOMException && err.name === "NotAllowedError";
      setError(
        denied
          ? "Necesitamos permiso para usar la cámara. Habilitalo en tu navegador y volvé a intentar."
          : "No pudimos iniciar el reconocimiento en este navegador.",
      );
      setStage("error");
    }
  }

  function restart() {
    stopCamera();
    setStage("setup");
    setFilled(0);
    setPhase("idle");
  }

  // Attach the stream once the practice screen (and its <video>) is mounted.
  useEffect(() => {
    if (stage !== "practice") return;
    const video = videoRef.current;
    if (!video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {});
  }, [stage]);

  // Detection + recognition + drawing loop, as signa-ml's demo page does it: the recognizer works
  // apart (there, a server; here, a Web Worker) on one frame at a time, and the page only draws,
  // every animation frame, easing the skeleton toward the latest detection.
  useEffect(() => {
    if (stage !== "practice") return;
    const engine = engineRef.current;
    const video = videoRef.current;
    const overlay = overlayRef.current;
    if (!engine || !video || !overlay) return;

    const verifier = new LetterVerifier();
    const frame = document.createElement("canvas");
    const fctx = frame.getContext("2d");
    const octx = overlay.getContext("2d");
    if (!fctx || !octx) return;
    const accent = cssColor("--color-primary");
    const success = cssColor("--color-success");
    const halo = cssColor("--color-surface");
    let raf = 0;
    let alive = true;
    let busy = false;
    let count = 0;
    let lastTarget = "";
    let hitTimer: ReturnType<typeof setTimeout> | undefined;

    const setLivePhase = (p: Phase) => {
      if (live.current.phase === p) return;
      live.current.phase = p;
      setPhase(p);
    };

    /** The current camera frame, mirrored and with what the viewport doesn't show blanked out. */
    const capture = (): boolean => {
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return false;
      const w = FRAME_WIDTH;
      const h = Math.round((vh / vw) * w);
      if (frame.width !== w || frame.height !== h) {
        frame.width = w;
        frame.height = h;
      }
      // Mirrored, like the dataset and the app: the training frames are flipped (cv2.flip).
      fctx.setTransform(-1, 0, 0, 1, w, 0);
      fctx.drawImage(video, 0, 0, w, h);
      fctx.setTransform(1, 0, 0, 1, 0, 0);
      // Only what the visitor sees counts: blank out what object-fit:cover leaves out of view.
      const vis = visibleRegion(vw, vh, video.clientWidth, video.clientHeight);
      if (vis) {
        fctx.fillStyle = "black";
        const x0 = vis.x * w;
        const y0 = vis.y * h;
        const x1 = x0 + vis.w * w;
        const y1 = y0 + vis.h * h;
        if (x0 > 0) {
          fctx.fillRect(0, 0, Math.ceil(x0), h);
          fctx.fillRect(Math.floor(x1), 0, w, h);
        }
        if (y0 > 0) {
          fctx.fillRect(0, 0, w, Math.ceil(y0));
          fctx.fillRect(0, Math.floor(y1), w, h);
        }
      }
      return true;
    };

    const recognize = (probs: Float32Array | null, hand: boolean, now: number) => {
      const state = live.current;
      const letter = state.name[state.filled] ?? "";
      if (letter !== lastTarget) {
        verifier.reset();
        lastTarget = letter;
      }
      if (!state.running || !state.signsReady || !letter || state.phase === "hit") {
        verifier.reset();
        return;
      }
      if (!hand) {
        verifier.reset();
        setLivePhase("idle");
        return;
      }
      setLivePhase("capturing");
      const index = engine.labels.indexOf(letter);
      if (!probs || index < 0) return;
      const step = verifier.push(probs, index, engine.thresholds[letter] ?? 0.5);
      if (step.confirmed && now >= state.cooldownUntil) {
        verifier.reset();
        state.cooldownUntil = now + COOLDOWN_MS;
        const next = state.filled + 1;
        state.filled = next;
        state.phase = "hit";
        setFilled(next);
        setPhase("hit");
        hitTimer = setTimeout(
          () => {
            if (next >= state.name.length) {
              setStage("complete");
              stopCamera();
            } else {
              state.phase = "idle";
              setPhase("idle");
            }
          },
          next >= state.name.length ? 900 : HIT_MS,
        );
      }
    };

    /** One frame in flight: the next one leaves when this one comes back. */
    const send = () => {
      if (busy || video.readyState < 2 || !capture()) return;
      busy = true;
      const state = live.current;
      const classify =
        state.running && state.signsReady && state.phase !== "hit" && !!state.name[state.filled];
      void createImageBitmap(frame)
        .then((bitmap) => engine.process(bitmap, count++ % FRAMES_PER_POSE === 0, classify))
        .then(({ landmarks, probs }) => {
          if (!alive) return;
          live.current.target = landmarks;
          recognize(probs, landmarks !== null, performance.now());
        })
        .catch(() => {})
        .finally(() => {
          busy = false;
        });
    };

    const draw = () => {
      const w = overlay.clientWidth;
      const h = overlay.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (overlay.width !== Math.round(w * dpr)) {
        overlay.width = Math.round(w * dpr);
        overlay.height = Math.round(h * dpr);
      }
      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.clearRect(0, 0, w, h);
      // Without a hand the skeleton is hidden but remembered, as LandmarkRenderer does in
      // signa-ml's demo (static/signa.js).
      const { target: tgt, skeleton } = live.current;
      if (!tgt || !skeleton) return;
      const drawn = (live.current.drawn ??= tgt.map((p) => ({ ...p })));
      drawn.forEach((p, i) => {
        const t = tgt[i]!;
        p.x += (t.x - p.x) * 0.35;
        p.y += (t.y - p.y) * 0.35;
      });
      // The <video> is shown with object-fit: cover: map the frame's coordinates the same way.
      const vw = video.videoWidth || 4;
      const vh = video.videoHeight || 3;
      const s = Math.max(w / vw, h / vh);
      const ox = (w - vw * s) / 2;
      const oy = (h - vh * s) / 2;
      const pts = drawn.map((p) => [ox + p.x * vw * s, oy + p.y * vh * s] as const);
      const color = live.current.phase === "hit" ? success : accent;
      octx.lineCap = "round";
      for (const [style, width] of [
        [halo, 5],
        [color, 2.4],
      ] as const) {
        octx.strokeStyle = style;
        octx.globalAlpha = style === halo ? 0.55 : 1;
        octx.lineWidth = width;
        for (const [a, b] of HAND_LINKS) {
          const pa = pts[a]!;
          const pb = pts[b]!;
          octx.beginPath();
          octx.moveTo(pa[0], pa[1]);
          octx.lineTo(pb[0], pb[1]);
          octx.stroke();
        }
      }
      octx.globalAlpha = 1;
      pts.forEach(([x, y], i) => {
        const r = i === 0 ? 5.5 : TIPS.has(i) ? 4.6 : 3.4;
        octx.beginPath();
        octx.arc(x, y, r + 1.6, 0, Math.PI * 2);
        octx.globalAlpha = 0.9;
        octx.fillStyle = halo;
        octx.fill();
        octx.globalAlpha = 1;
        octx.beginPath();
        octx.arc(x, y, r, 0, Math.PI * 2);
        octx.fillStyle = color;
        octx.fill();
      });
    };

    const loop = () => {
      raf = requestAnimationFrame(loop);
      send();
      draw();
    };
    raf = requestAnimationFrame(loop);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(hitTimer);
    };
  }, [stage, stopCamera]);

  const capturing = phase === "capturing";
  const hit = phase === "hit";
  const lastLetter = name[Math.max(filled - 1, 0)] ?? "";

  return (
    <div className={cn("bg-background flex flex-col", className)}>
      <p className="text-text-muted shrink-0 px-4 pt-7 text-[10.5px] font-extrabold tracking-wider">
        PRÁCTICA LIBRE · <span className="text-text">DELETREÁ TU NOMBRE</span>
      </p>

      {(stage === "setup" || stage === "loading" || stage === "error") && (
        <form onSubmit={start} className="flex flex-1 flex-col px-5 pt-5 pb-5">
          <h4 className="font-display text-[28px] leading-tight font-extrabold tracking-tight">
            ¿Cómo te llamás?
          </h4>
          <p className="text-text-muted mt-2 text-sm leading-relaxed">
            Vas a deletrearlo letra por letra con el alfabeto de la LSA, y la cámara te va a ir
            diciendo si te sale.
          </p>
          <label className="bg-surface border-border mt-5 flex flex-col gap-1 rounded-2xl border px-4 py-3">
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setWarning(null);
              }}
              maxLength={MAX_NAME_LENGTH + 4}
              autoComplete="off"
              placeholder="Nombre"
              disabled={stage === "loading"}
              className="font-display placeholder:text-fill-dark w-full bg-transparent text-2xl font-extrabold tracking-wide uppercase outline-none"
            />
          </label>
          {warning && (
            <p
              role="alert"
              className="bg-danger-light text-danger mt-3 rounded-xl px-3 py-2 text-sm font-bold"
            >
              {warning}
            </p>
          )}
          {stage === "error" && error && (
            <p
              role="alert"
              className="bg-danger-light text-danger mt-3 rounded-xl px-3 py-2 text-sm font-bold"
            >
              {error}
            </p>
          )}
          <p className="text-text-muted mt-auto flex items-center gap-1.5 pt-4 text-xs font-semibold">
            <svg
              aria-hidden="true"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinejoin="round"
              className="text-course-teal shrink-0"
            >
              <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
            </svg>
          </p>
          <button
            type="submit"
            disabled={stage === "loading"}
            className="bg-primary text-on-primary mt-3 flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl text-[15px] font-extrabold transition-opacity disabled:cursor-wait disabled:opacity-80"
          >
            {stage === "loading" ? (
              <>
                <span
                  aria-hidden
                  className="border-on-primary/30 border-t-on-primary h-4 w-4 animate-spin rounded-full border-2"
                />
                Preparando la cámara…
              </>
            ) : (
              "Empezar a deletrear"
            )}
          </button>
        </form>
      )}

      {stage === "practice" && (
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-4 pt-3 pb-4">
          <h4 className="font-display shrink-0 text-xl font-extrabold tracking-tight">
            Hacé la letra <span className="text-primary">{target}</span>
          </h4>

          <div
            ref={viewportRef}
            className="bg-ink-900 relative min-h-0 flex-1 overflow-hidden rounded-[22px]"
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
            />
            <canvas
              ref={overlayRef}
              className="pointer-events-none absolute inset-0 h-full w-full"
            />

            <div className="bg-surface/95 absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold">
              <i
                className={cn(
                  "h-2 w-2 rounded-full",
                  hit ? "bg-success" : capturing ? "bg-primary" : "bg-text-muted",
                )}
              />
              {!signsReady
                ? "Preparando las señas…"
                : !running
                  ? "En pausa"
                  : hit
                    ? "Letra confirmada"
                    : capturing
                      ? "Capturando seña"
                      : "Listo · esperando manos"}
            </div>

            <button
              type="button"
              onClick={() => setShowSkeleton((v) => !v)}
              aria-pressed={showSkeleton}
              aria-label={showSkeleton ? "Ocultar el esqueleto" : "Mostrar el esqueleto"}
              className={cn(
                "absolute top-3 right-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-colors",
                showSkeleton ? "bg-primary text-on-primary" : "bg-surface/95 text-text",
              )}
            >
              <BodyIcon filled={showSkeleton} />
            </button>

            {target && (
              <SignPip
                sign={target}
                preload={letters}
                onAllLoaded={onSignsLoaded}
                viewportRef={viewportRef}
              />
            )}

            {capturing && running && (
              <div className="absolute inset-x-0 bottom-0 z-10 h-1 overflow-hidden bg-white/35">
                <i className="landing-sweep block h-full w-[38%] bg-white" />
              </div>
            )}

            {hit && (
              <div
                aria-live="polite"
                className="landing-modal-in bg-surface/95 absolute inset-x-3 bottom-3 z-30 flex items-center gap-3 rounded-2xl px-3.5 py-3"
              >
                <span className="bg-success-light text-success-dark font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl font-extrabold">
                  {lastLetter}
                </span>
                <span className="min-w-0">
                  <span className="font-display text-success-dark block text-[15px] font-bold">
                    ¡Correcto!
                  </span>
                  <span className="block text-[12.5px]">
                    Letra {lastLetter} sumada a {name}.
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="flex shrink-0 justify-center gap-2">
            {name.split("").map((ch, i) => {
              const done = i < filled;
              const active = i === filled;
              return (
                <span
                  key={i}
                  className={cn(
                    "font-display flex h-14 items-center justify-center rounded-2xl text-2xl font-extrabold transition-all duration-300",
                    name.length > 6 ? "w-9" : "w-12",
                    done && "border-success bg-success-light text-success-dark border-2",
                    active && "border-primary bg-surface text-primary scale-105 border-2",
                    !done &&
                      !active &&
                      "border-border bg-surface text-fill-dark border border-dashed",
                  )}
                >
                  {done || active ? ch : "·"}
                </span>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setRunning((r) => !r)}
            className={cn(
              "flex h-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl text-[15px] font-extrabold transition-colors",
              running ? "bg-fill text-text" : "bg-primary text-on-primary",
            )}
          >
            {running ? "Pausar reconocimiento" : "Seguir reconociendo"}
          </button>
        </div>
      )}

      {stage === "complete" && (
        <div className="landing-modal-in flex flex-1 flex-col items-center gap-3 px-5 pt-10 pb-5">
          <span className="bg-primary-light flex h-24 w-24 items-center justify-center rounded-[28px]">
            <svg
              aria-hidden="true"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              className="fill-primary"
            >
              <path d="M6 4h12v2h3v3a4 4 0 01-4 4h-.6A6 6 0 0113 15.9V18h3v2H8v-2h3v-2.1A6 6 0 017.6 13H7a4 4 0 01-4-4V6h3V4zm0 4H5v1a2 2 0 002 2V8zm12 0v3a2 2 0 002-2V8h-2z" />
            </svg>
          </span>
          <h4 className="font-display mt-2 text-center text-3xl leading-tight font-extrabold tracking-tight text-balance">
            ¡{name} completado!
          </h4>
          <p className="text-text-muted text-sm">Deletreo · Alfabeto LSA</p>
          <div className="mt-3 grid w-full grid-cols-3 gap-2">
            {[
              { value: `+${name.length * 5}`, label: "XP ganado" },
              { value: `${name.length}/${name.length}`, label: "Aciertos" },
              { value: new Set(name).size, label: "Letras nuevas" },
            ].map((s) => (
              <span
                key={s.label}
                className="bg-surface border-border flex flex-col items-center gap-1 rounded-2xl border px-2 py-3"
              >
                <b className="font-display text-xl">{s.value}</b>
                <span className="text-text-muted text-center text-[11px] font-semibold">
                  {s.label}
                </span>
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={restart}
            className="bg-primary text-on-primary mt-auto flex h-12 w-full cursor-pointer items-center justify-center rounded-2xl text-[15px] font-extrabold"
          >
            Deletrear otro nombre
          </button>
        </div>
      )}
    </div>
  );
}

// ── Lisa in a picture-in-picture, the same as signa-ml's demo (demo/static/nombre.html) ──
// 104×138 in a corner, dragged and snapped to the nearest corner, tapped to fill the viewport (where
// dragging rotates the model) and closed with the X. Sizes are layout pixels of the viewport: the
// phone around it may be scaled, so pointer deltas are divided by that scale.

const PIP_W = 104;
const PIP_H = 138;
const PIP_M = 12;
/** Corners keep clear of the status badge and skeleton toggle on top, and the bottom bar. */
const PIP_TOP = 56;
const PIP_BOTTOM = 52;

type Corner = "tl" | "tr" | "bl" | "br";

function cornerPos(corner: Corner, w: number, h: number) {
  const bottom = Math.max(PIP_TOP, h - PIP_H - PIP_BOTTOM);
  return {
    x: corner.endsWith("l") ? PIP_M : w - PIP_W - PIP_M,
    y: corner.startsWith("t") ? PIP_TOP : bottom,
  };
}

function nearestCorner(x: number, y: number, w: number, h: number): Corner {
  let best: Corner = "tr";
  let bestD = Infinity;
  for (const c of ["tl", "tr", "bl", "br"] as const) {
    const p = cornerPos(c, w, h);
    const d = Math.hypot(p.x - x, p.y - y);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return best;
}

function SignPip({
  sign,
  preload,
  onAllLoaded,
  viewportRef,
}: {
  sign: string;
  /** Every sign of the exercise, loaded up front so switching letters never stalls the page. */
  preload: readonly string[];
  onAllLoaded: () => void;
  viewportRef: RefObject<HTMLDivElement | null>;
}) {
  const loaded = useRef(new Set<string>());
  const preloadKey = preload.join("");
  const onLoaded = useCallback(
    (s: string) => {
      loaded.current.add(s);
      if ([...preloadKey].every((l) => loaded.current.has(l))) onAllLoaded();
    },
    [preloadKey, onAllLoaded],
  );
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [corner, setCorner] = useState<Corner>("tr");
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  const [big, setBig] = useState(false);
  const [hint, setHint] = useState(true);
  const start = useRef<{ px: number; py: number; x: number; y: number; moved: boolean } | null>(
    null,
  );
  // Where the drag is, read on release: state may not have re-rendered after the last move.
  const dragPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const measure = () => setSize({ w: vp.clientWidth, h: vp.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, [viewportRef]);

  if (!size.w) return null;
  const home = cornerPos(corner, size.w, size.h);
  const pos = drag ?? home;
  const scale = () => {
    const vp = viewportRef.current;
    return vp && vp.clientWidth ? vp.getBoundingClientRect().width / vp.clientWidth : 1;
  };

  function onDown(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { px: e.clientX, py: e.clientY, x: home.x, y: home.y, moved: false };
  }
  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    const s = start.current;
    if (!s) return;
    const k = scale();
    const dx = (e.clientX - s.px) / k;
    const dy = (e.clientY - s.py) / k;
    if (!s.moved && Math.hypot(dx, dy) < 6) return; // a tap trembles a little
    s.moved = true;
    setHint(false);
    dragPos.current = {
      x: Math.max(0, Math.min(size.w - PIP_W, s.x + dx)),
      y: Math.max(0, Math.min(size.h - PIP_H, s.y + dy)),
    };
    setDrag(dragPos.current);
  }
  function onUp() {
    const s = start.current;
    const at = dragPos.current;
    start.current = null;
    dragPos.current = null;
    if (!s) return;
    if (s.moved && at) {
      setCorner(nearestCorner(at.x, at.y, size.w, size.h));
      setDrag(null);
    } else {
      setBig(true);
    }
  }

  const box = big
    ? { left: PIP_M, top: PIP_M, width: size.w - 2 * PIP_M, height: size.h - 2 * PIP_M }
    : { left: pos.x, top: pos.y, width: PIP_W, height: PIP_H };

  return (
    <div
      style={box}
      className={cn(
        "bg-fill shadow-text/30 absolute z-20 overflow-hidden border-2 border-white/90 shadow-xl",
        big ? "rounded-[22px]" : "rounded-[18px]",
        drag
          ? "cursor-grabbing"
          : "transition-[left,top,width,height,border-radius] duration-300 ease-[cubic-bezier(0.34,1.2,0.5,1)]",
      )}
    >
      <LisaGlbViewer sign={sign} preload={preload} onLoaded={onLoaded} />
      {!big && (
        <div
          aria-label="Tocá para agrandar la seña. Arrastrala para moverla."
          role="button"
          tabIndex={0}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => {
            start.current = null;
            dragPos.current = null;
            setDrag(null);
          }}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setBig(true)}
          className="absolute inset-0 z-10 cursor-grab touch-none"
        />
      )}
      {!big && hint && (
        <span className="bg-text/70 text-on-dark pointer-events-none absolute inset-x-[7px] bottom-[7px] z-20 rounded-lg px-1 py-1 text-center text-[9px] leading-tight font-medium whitespace-nowrap">
          tocá para agrandar
        </span>
      )}
      {big && (
        <button
          type="button"
          onClick={() => setBig(false)}
          aria-label="Achicar la seña"
          className="bg-surface/95 shadow-text/20 absolute top-2 right-2 z-20 flex h-[30px] w-[30px] cursor-pointer items-center justify-center rounded-full shadow-md"
        >
          <svg
            aria-hidden="true"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}

/** Ionicons 7 `body` / `body-outline` (MIT) — the same icon as the skeleton toggle in the app. */
function BodyIcon({ filled }: { filled: boolean }) {
  return filled ? (
    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 512 512" fill="currentColor">
      <circle cx="256" cy="56" r="56" />
      <path d="M437 128H75a27 27 0 000 54h101.88c6.91 0 15 3.09 19.58 15 5.35 13.83 2.73 40.54-.57 61.23l-4.32 24.45a.42.42 0 01-.12.35l-34.6 196.81A27.43 27.43 0 00179 511.58a27.06 27.06 0 0031.42-22.29l23.91-136.8S242 320 256 320c14.23 0 21.74 32.49 21.74 32.49l23.91 136.92a27.24 27.24 0 1053.62-9.6L320.66 283a.45.45 0 00-.11-.35l-4.33-24.45c-3.3-20.69-5.92-47.4-.57-61.23 4.56-11.88 12.91-15 19.28-15H437a27 27 0 000-54z" />
    </svg>
  ) : (
    <svg aria-hidden="true" width="17" height="17" viewBox="0 0 512 512">
      <circle
        fill="none"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeWidth="32"
        cx="256"
        cy="56"
        r="40"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeMiterlimit="10"
        strokeWidth="32"
        d="M199.3 295.62h0l-30.4 172.2a24 24 0 0019.5 27.8 23.76 23.76 0 0027.6-19.5l21-119.9v.2s5.2-32.5 17.5-32.5h3.1c12.5 0 17.5 32.5 17.5 32.5v-.1l21 119.9a23.92 23.92 0 1047.1-8.4l-30.4-172.2-4.9-29.7c-2.9-18.1-4.2-47.6.5-59.7 4-10.4 14.13-14.2 23.2-14.2H424a24 24 0 000-48H88a24 24 0 000 48h92.5c9.23 0 19.2 3.8 23.2 14.2 4.7 12.1 3.4 41.6.5 59.7z"
      />
    </svg>
  );
}

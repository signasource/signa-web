"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import {
  adminApi,
  type AdminBlock,
  type AdminCourseVersionDetail,
  type AdminCourseVersionListItem,
  type AdminLesson,
  type AdminSign,
  type AdminTopic,
  type BlockConfig,
  type CourseVersionStatus,
  type SaveCourseVersionPayload,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";

// ─── types ───────────────────────────────────────────────────────────────────

type HomeTab = "estado" | "curso";
type SaveStatus = "saved" | "saving" | "unsaved";

type ConfirmDialog = {
  title: string;
  body: string;
  onConfirm: () => void;
};

type DrawerTarget = {
  topicIdx: number;
  lessonIdx: number;
  blockIdx: number;
  field: string;
  multi: boolean;
};

// ─── block definitions ────────────────────────────────────────────────────────

const BLOCK_TYPES: Record<
  string,
  { label: string; bg: string; xp: boolean; wide: boolean; fields: [string, string, string][] }
> = {
  INFO: {
    label: "Información",
    bg: "bg-[#EBE3DB]",
    xp: false,
    wide: true,
    fields: [
      ["title", "text", "Título"],
      ["text", "textarea", "Texto"],
    ],
  },
  INTRODUCE_SIGN: {
    label: "Presentar seña",
    bg: "bg-[#EEE8FF]",
    xp: true,
    wide: false,
    fields: [
      ["meaning", "sign", "Seña"],
    ],
  },
  SELECT_MEANING: {
    label: "Elegir significado",
    bg: "bg-[#E4F1EC]",
    xp: true,
    wide: false,
    fields: [
      ["sign", "sign", "Seña correcta"],
      ["options", "words", "Opciones de significado"],
    ],
  },
  SELECT_SIGN: {
    label: "Elegir seña",
    bg: "bg-[#E4F1FB]",
    xp: true,
    wide: false,
    fields: [
      ["word", "text", "Palabra"],
      ["options", "signs", "Señas opcionales"],
    ],
  },
  CONTEXT_RESPONSE: {
    label: "Respuesta en contexto",
    bg: "bg-[#FEF0DE]",
    xp: true,
    wide: false,
    fields: [
      ["question", "text", "Pregunta"],
      ["answer", "text", "Respuesta correcta"],
      ["options", "words", "Opciones"],
    ],
  },
  MATCH: {
    label: "Emparejar",
    bg: "bg-[#FDE8F1]",
    xp: true,
    wide: false,
    fields: [["concepts", "signs", "Conceptos"]],
  },
  VISUAL_RECOGNITION: {
    label: "Reconocimiento visual",
    bg: "bg-[#E9F3EB]",
    xp: true,
    wide: false,
    fields: [
      ["signSequence", "signs", "Secuencia"],
      ["options", "signs", "Opciones"],
    ],
  },
  PERFORM_SIGN: {
    label: "Hacer la seña",
    bg: "bg-[#FBE0D8]",
    xp: true,
    wide: false,
    fields: [["sign", "sign", "Seña a realizar"]],
  },
  SPELL_NAME: {
    label: "Deletrear nombre",
    bg: "bg-[#E0F4F2]",
    xp: true,
    wide: false,
    fields: [],
  },
  INVISIBLE_SIGNS: {
    label: "Señas invisibles",
    bg: "bg-[#F2ECE6]",
    xp: false,
    wide: false,
    fields: [["signs", "signs", "Señas"]],
  },
};

const UNIT_TINTS = [
  "bg-[#E4F1EC]",
  "bg-[#FEF0DE]",
  "bg-[#FDE8F1]",
  "bg-[#E4F1FB]",
  "bg-[#E9F3EB]",
  "bg-[#EEE8FF]",
  "bg-[#E0F4F2]",
];

// ─── helpers ──────────────────────────────────────────────────────────────────

function formatAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 2) return "recién";
  if (mins < 60) return `hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours} h`;
  if (hours < 48) return "ayer";
  return `hace ${Math.floor(hours / 24)} días`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function groupByCourse(
  versions: AdminCourseVersionListItem[],
): { courseName: string; items: AdminCourseVersionListItem[] }[] {
  const map = new Map<string, AdminCourseVersionListItem[]>();
  for (const v of versions) {
    const list = map.get(v.courseId) ?? [];
    list.push(v);
    map.set(v.courseId, list);
  }
  return Array.from(map.values()).map((items) => ({
    courseName: items[0]!.courseName,
    items,
  }));
}

function priceLabel(item: AdminCourseVersionListItem): string {
  if (item.isFree) return "Gratis";
  if (item.price) return `$${item.price.toLocaleString("es-AR")}`;
  return "Pago";
}

function countSigns(topics: AdminTopic[]): number {
  return topics
    .flatMap((t) => t.lessons)
    .flatMap((l) => l.blocks)
    .filter((b) => b.type === "INTRODUCE_SIGN").length;
}

function statusColors(status: CourseVersionStatus) {
  if (status === "DRAFT") return "bg-[rgba(251,191,36,.18)] text-[#B85806]";
  if (status === "PUBLISHED") return "bg-[rgba(76,166,92,.12)] text-[#2E7D45]";
  return "bg-[#EBE3DB] text-[#8C817A]";
}

function statusLabel(status: CourseVersionStatus) {
  if (status === "DRAFT") return "Borrador";
  if (status === "PUBLISHED") return "Publicada";
  return "Archivada";
}

// ─── deep clone editor state ──────────────────────────────────────────────────

function cloneDetail(d: AdminCourseVersionDetail): AdminCourseVersionDetail {
  return JSON.parse(JSON.stringify(d));
}

// ─── components ──────────────────────────────────────────────────────────────

function BlockField({
  fieldDef,
  value,
  readOnly,
  onChange,
  onPickSign,
  onPickSigns,
}: {
  fieldDef: [string, string, string];
  value: unknown;
  readOnly: boolean;
  onChange: (v: unknown) => void;
  onPickSign: (currentMeaning?: string) => void;
  onPickSigns: () => void;
}) {
  const [, fieldType, label] = fieldDef;

  const chips = Array.isArray(value) ? (value as string[]) : [];
  const [wordInput, setWordInput] = useState("");

  if (fieldType === "text") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-wider text-[rgba(36,26,22,.7)] uppercase">
          {label}
        </span>
        <input
          readOnly={readOnly}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-md border-0 bg-[rgba(255,255,255,.65)] px-2.5 py-2 text-sm text-[#241A16]"
        />
      </div>
    );
  }

  if (fieldType === "textarea") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-wider text-[rgba(36,26,22,.7)] uppercase">
          {label}
        </span>
        <textarea
          readOnly={readOnly}
          value={typeof value === "string" ? value : ""}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-y rounded-md border-0 bg-[rgba(255,255,255,.65)] px-2.5 py-2 text-sm leading-relaxed text-[#241A16]"
        />
      </div>
    );
  }

  if (fieldType === "number") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-wider text-[rgba(36,26,22,.7)] uppercase">
          {label}
        </span>
        <input
          readOnly={readOnly}
          inputMode="numeric"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="w-20 rounded-md border-0 bg-[rgba(255,255,255,.65)] px-2.5 py-2 text-sm font-semibold text-[#241A16]"
        />
      </div>
    );
  }

  if (fieldType === "toggle") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-wider text-[rgba(36,26,22,.7)] uppercase">
          {label}
        </span>
        <button
          onClick={() => !readOnly && onChange(!value)}
          className="relative h-6 w-10 rounded-full border-0 p-0"
          style={{ background: value ? "#241A16" : "#D9CFC5" }}
        >
          <span
            className="absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-transform"
            style={{ left: 3, transform: value ? "translateX(16px)" : "translateX(0)" }}
          />
        </button>
      </div>
    );
  }

  if (fieldType === "sign") {
    const meaning = typeof value === "string" ? value : null;
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-wider text-[rgba(36,26,22,.7)] uppercase">
          {label}
        </span>
        {meaning ? (
          <button
            onClick={() => onPickSign(meaning)}
            className="flex cursor-pointer items-center gap-2.5 rounded-md border-0 bg-white p-1.5 text-left hover:shadow-[0_0_0_2px_#241A16]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded bg-[#1E1714] font-mono text-[10px] font-bold text-white">
              GLB
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span className="text-[15px] font-bold text-[#241A16]">{meaning}</span>
            </span>
            <span className="pr-1.5 text-xs font-semibold text-[#7857FF]">Cambiar</span>
          </button>
        ) : (
          <button
            onClick={() => onPickSign()}
            className="flex items-center gap-2 rounded-md border border-dashed border-[rgba(36,26,22,.25)] bg-[rgba(255,255,255,.4)] px-3 py-3.5 text-sm font-semibold text-[rgba(36,26,22,.75)] hover:border-[#241A16] hover:text-[#241A16]"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="M16 16l4.5 4.5" />
            </svg>
            Buscar seña por significado
          </button>
        )}
      </div>
    );
  }

  if (fieldType === "signs" || fieldType === "words") {
    const isWords = fieldType === "words";

    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold tracking-wider text-[rgba(36,26,22,.7)] uppercase">
          {label}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 rounded-md bg-white px-1 py-0.5 text-sm font-semibold text-[#241A16]"
            >
              {!isWords && (
                <span className="rounded bg-[#1E1714] px-1 py-0.5 font-mono text-[9px] font-bold text-white">
                  GLB
                </span>
              )}
              <span className="px-0.5">{chip}</span>
              {!readOnly && (
                <button
                  onClick={() => onChange(chips.filter((_, j) => j !== i))}
                  className="flex h-5 w-5 items-center justify-center rounded border-0 bg-transparent text-[#8C817A] hover:bg-[#F2ECE6] hover:text-[#241A16]"
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {!readOnly && !isWords && (
            <button
              onClick={onPickSigns}
              className="rounded-md border border-dashed border-[rgba(36,26,22,.25)] bg-transparent px-2.5 py-1 text-sm font-semibold text-[rgba(36,26,22,.75)] hover:border-[#241A16] hover:text-[#241A16]"
            >
              + seña
            </button>
          )}
          {!readOnly && isWords && (
            <input
              value={wordInput}
              onChange={(e) => setWordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && wordInput.trim()) {
                  onChange([...chips, wordInput.trim()]);
                  setWordInput("");
                  e.preventDefault();
                }
              }}
              placeholder="+ opción ↵"
              className="w-28 rounded-md border border-dashed border-[rgba(36,26,22,.25)] bg-transparent px-2.5 py-1 text-sm text-[#241A16]"
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function CoursesPage() {
  const queryClient = useQueryClient();

  // ── view state ──
  const [view, setView] = useState<"home" | "editor">("home");
  const [homeTab, setHomeTab] = useState<HomeTab>("estado");
  const [sortAsc, setSortAsc] = useState(false);

  // ── editor state ──
  const [ed, setEd] = useState<AdminCourseVersionDetail | null>(null);
  const [selectedTopicIdx, setSelectedTopicIdx] = useState(0);
  const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
  const [adding, setAdding] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  // ── drawer state ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<DrawerTarget | null>(null);
  const [signQuery, setSignQuery] = useState("");
  const [pickedSign, setPickedSign] = useState<AdminSign | null>(null);
  const [signAnimationUrl, setSignAnimationUrl] = useState<string | null>(null);
  const [signLateralUrl, setSignLateralUrl] = useState<string | null>(null);

  // ── publish modal ──
  const [publishOpen, setPublishOpen] = useState(false);

  // ── confirm dialog ──
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);

  // ── toast ──
  const [toast, setToast] = useState<string | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── queries ──

  const { data: versions, isLoading } = useQuery({
    queryKey: ["admin", "course-versions"],
    queryFn: adminApi.courseVersions,
  });

  const signSearchQuery = useQuery({
    queryKey: ["admin", "signs", signQuery],
    queryFn: () => adminApi.signs({ query: signQuery || undefined, size: 30 }),
    enabled: drawerOpen && signQuery.length > 0,
  });

  // ── mutations ──

  const createMutation = useMutation({
    mutationFn: (name: string) => adminApi.createCourse(name),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "course-versions"] });
      openEditor(data);
    },
  });

  const forkMutation = useMutation({
    mutationFn: (id: string) => adminApi.forkCourseVersion(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "course-versions"] });
      openEditor(data);
    },
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: SaveCourseVersionPayload }) =>
      adminApi.saveCourseVersion(id, payload),
    onSuccess: () => {
      setSaveStatus("saved");
      queryClient.invalidateQueries({ queryKey: ["admin", "course-versions"] });
    },
    onError: (err) => {
      setSaveStatus("unsaved");
      const msg = err instanceof ApiError ? err.message : "Error al guardar. Intentá de nuevo.";
      showToast(msg);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => adminApi.publishCourseVersion(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "course-versions"] });
      setPublishOpen(false);
      showToast("Curso publicado exitosamente.");
      openEditor(data);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => adminApi.archiveCourseVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "course-versions"] });
      showToast("Curso archivado.");
    },
  });

  const deleteDraftMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteCourseVersion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "course-versions"] });
      goHome();
      showToast("Borrador eliminado.");
    },
  });

  // ── auto-save ──

  function buildPayload(draft: AdminCourseVersionDetail): SaveCourseVersionPayload {
    return {
      name: draft.name,
      description: draft.description,
      isFree: draft.isFree,
      price: draft.price,
      color: draft.color,
      topics: draft.topics.map((t) => ({
        title: t.title,
        subtitle: t.subtitle,
        description: t.description,
        lessons: t.lessons.map((l) => ({
          name: l.name,
          description: l.description,
          blocks: l.blocks.map((b) => ({
            type: b.type,
            xpReward: b.xpReward,
            config: b.config,
          })),
        })),
      })),
    };
  }

  const triggerSave = useCallback(
    (draft: AdminCourseVersionDetail) => {
      if (draft.status !== "DRAFT") return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("unsaved");
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus("saving");
        const payload = buildPayload(draft);
        saveMutation.mutate({ id: draft.id, payload });
      }, 1500);
    },
    [saveMutation],
  );

  function openEditor(detail: AdminCourseVersionDetail) {
    setEd(detail);
    setSelectedTopicIdx(0);
    setSelectedLessonIdx(0);
    setAdding(false);
    setSaveStatus("saved");
    setView("editor");
  }

  function goHome() {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    setView("home");
    setEd(null);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  // ── editor mutators ──

  function updateEd(updater: (d: AdminCourseVersionDetail) => AdminCourseVersionDetail) {
    setEd((prev) => {
      if (!prev) return prev;
      const next = updater(cloneDetail(prev));
      triggerSave(next);
      return next;
    });
  }

  const topic = ed?.topics[selectedTopicIdx] ?? null;
  const lesson = topic?.lessons[selectedLessonIdx] ?? null;

  function setTopicField(field: keyof AdminTopic, val: unknown) {
    updateEd((d) => {
      (d.topics[selectedTopicIdx]! as Record<string, unknown>)[field] = val;
      return d;
    });
  }

  function setLessonField(field: keyof AdminLesson, val: unknown) {
    updateEd((d) => {
      (d.topics[selectedTopicIdx]!.lessons[selectedLessonIdx]! as Record<string, unknown>)[field] =
        val;
      return d;
    });
  }

  function setBlockConfigField(blockIdx: number, fieldKey: string, val: unknown) {
    updateEd((d) => {
      const block = d.topics[selectedTopicIdx]!.lessons[selectedLessonIdx]!.blocks[blockIdx]!;
      block.config = { ...block.config, [fieldKey]: val };
      return d;
    });
  }

  function moveBlock(blockIdx: number, dir: -1 | 1) {
    updateEd((d) => {
      const blocks = d.topics[selectedTopicIdx]!.lessons[selectedLessonIdx]!.blocks;
      const target = blockIdx + dir;
      if (target < 0 || target >= blocks.length) return d;
      [blocks[blockIdx], blocks[target]] = [blocks[target]!, blocks[blockIdx]!];
      blocks.forEach((b, i) => (b.order = i));
      return d;
    });
  }

  function deleteBlock(blockIdx: number) {
    updateEd((d) => {
      d.topics[selectedTopicIdx]!.lessons[selectedLessonIdx]!.blocks.splice(blockIdx, 1);
      d.topics[selectedTopicIdx]!.lessons[selectedLessonIdx]!.blocks.forEach(
        (b, i) => (b.order = i),
      );
      return d;
    });
  }

  function addBlock(type: string) {
    updateEd((d) => {
      const def = BLOCK_TYPES[type];
      const config: BlockConfig = {};
      (def?.fields ?? []).forEach(([key, ft]) => {
        if (ft === "toggle") config[key] = false;
        else if (ft === "signs" || ft === "words") config[key] = [];
        else if (ft === "number") config[key] = 10;
        else config[key] = "";
      });
      if (type === "SPELL_NAME") config["max_letters"] = 10;
      const order = d.topics[selectedTopicIdx]!.lessons[selectedLessonIdx]!.blocks.length;
      d.topics[selectedTopicIdx]!.lessons[selectedLessonIdx]!.blocks.push({
        id: `new-${Date.now()}`,
        type,
        order,
        xpReward: def?.xp ? 10 : null,
        config,
      } as AdminBlock);
      return d;
    });
    setAdding(false);
  }

  function addUnit() {
    updateEd((d) => {
      d.topics.push({
        id: `new-${Date.now()}`,
        title: `Unidad ${d.topics.length}`,
        subtitle: "",
        description: "",
        lessons: [],
      } as AdminTopic);
      return d;
    });
    setSelectedTopicIdx(ed?.topics.length ?? 0);
    setSelectedLessonIdx(0);
  }

  function deleteUnit() {
    updateEd((d) => {
      d.topics.splice(selectedTopicIdx, 1);
      return d;
    });
    setSelectedTopicIdx(Math.max(0, selectedTopicIdx - 1));
    setSelectedLessonIdx(0);
  }

  function addLesson() {
    updateEd((d) => {
      const lessons = d.topics[selectedTopicIdx]!.lessons;
      lessons.push({
        id: `new-${Date.now()}`,
        name: `Lección ${lessons.length + 1}`,
        description: "",
        blocks: [],
      } as AdminLesson);
      return d;
    });
    setSelectedLessonIdx(topic?.lessons.length ?? 0);
  }

  function deleteLesson(lessonIdx: number) {
    updateEd((d) => {
      d.topics[selectedTopicIdx]!.lessons.splice(lessonIdx, 1);
      return d;
    });
    setSelectedLessonIdx(Math.max(0, selectedLessonIdx - 1));
  }

  // ── drawer helpers ──

  function openSignPicker(target: DrawerTarget, initialQuery?: string) {
    setDrawerTarget(target);
    setPickedSign(null);
    setSignAnimationUrl(null);
    setSignQuery(initialQuery ?? "");
    setDrawerOpen(true);
  }

  function usePicked() {
    if (!pickedSign || !drawerTarget) return;
    const { topicIdx, lessonIdx, blockIdx, field, multi } = drawerTarget;
    updateEd((d) => {
      const block = d.topics[topicIdx]!.lessons[lessonIdx]!.blocks[blockIdx]!;
      if (multi) {
        const arr = Array.isArray(block.config[field])
          ? [...(block.config[field] as string[])]
          : [];
        if (!arr.includes(pickedSign.meaning)) arr.push(pickedSign.meaning);
        block.config = { ...block.config, [field]: arr };
      } else {
        block.config = { ...block.config, [field]: pickedSign.meaning };
      }
      return d;
    });
    setDrawerOpen(false);
    setPickedSign(null);
    setSignAnimationUrl(null);
  }

  function pickSignAndFetchAnimation(sign: AdminSign) {
    setPickedSign(sign);
    setSignAnimationUrl(null);
    setSignLateralUrl(null);
    adminApi
      .signAnimation(sign.meaning)
      .then((r) => setSignAnimationUrl(r.url))
      .catch(() => setSignAnimationUrl(null));
    if (sign.animationFormat === "mp4") {
      adminApi
        .signAnimation(sign.meaning + "_lateral")
        .then((r) => setSignLateralUrl(r.url))
        .catch(() => setSignLateralUrl(null));
    }
  }

  // ── publish helpers ──

  function publishIssues(): { text: string }[] {
    if (!ed) return [];
    const issues: { text: string }[] = [];
    if (!ed.name.trim()) issues.push({ text: "El curso necesita un nombre." });
    if (ed.topics.length === 0) issues.push({ text: "El curso necesita al menos una unidad." });
    ed.topics.forEach((t, ti) => {
      if (t.lessons.length === 0) issues.push({ text: `Unidad ${ti + 1} no tiene lecciones.` });
      t.lessons.forEach((l, li) => {
        if (l.blocks.length === 0)
          issues.push({ text: `Unidad ${ti + 1} · Lección ${li + 1} no tiene bloques.` });
      });
    });
    return issues;
  }

  // ── home data ──

  function sortVersions(list: AdminCourseVersionListItem[]) {
    return [...list].sort((a, b) => {
      const ta = new Date(a.updatedAt ?? a.publishedAt ?? 0).getTime();
      const tb = new Date(b.updatedAt ?? b.publishedAt ?? 0).getTime();
      return sortAsc ? ta - tb : tb - ta;
    });
  }

  const allVersions = versions ?? [];
  const drafts = sortVersions(allVersions.filter((v) => v.status === "DRAFT"));
  const published = sortVersions(allVersions.filter((v) => v.status === "PUBLISHED"));
  const archived = sortVersions(allVersions.filter((v) => v.status === "ARCHIVED"));
  const byCourse = groupByCourse(sortVersions(allVersions));

  // ─── render ─────────────────────────────────────────────────────────────────

  if (view === "home" || !ed) {
    return (
      <div>
        {/* header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display mb-2 text-2xl font-bold text-[#241A16]">Cursos</h1>
            <p className="max-w-xl text-sm text-[#8C817A]">
              Borradores, versiones publicadas y archivo de cada curso. Los borradores se guardan
              solos y los ven todos los administradores.
            </p>
          </div>
          <button
            onClick={() => createMutation.mutate("Nuevo curso")}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 rounded-xl border-0 bg-[#241A16] px-4 py-2.5 text-sm font-semibold text-[#FBF6F2] hover:bg-[#3A2F2A] disabled:opacity-50"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo curso
          </button>
        </div>

        {/* tabs + sort */}
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <div className="flex w-fit gap-1 rounded-xl bg-[#F2ECE6] p-1">
            {(
              [
                { key: "estado", label: "Por estado" },
                { key: "curso", label: "Por curso" },
              ] as { key: HomeTab; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setHomeTab(key)}
                className={cn(
                  "rounded-lg border-0 px-4 py-2 text-sm font-semibold transition-colors",
                  homeTab === key
                    ? "bg-white text-[#241A16] shadow-sm"
                    : "bg-transparent text-[#8C817A] hover:text-[#241A16]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortAsc((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl border border-[#ECE5DE] bg-white px-3.5 py-2 text-sm font-semibold text-[#241A16] hover:bg-[#F2ECE6]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              {sortAsc ? <><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></> : <><path d="M12 5v14"/><path d="M6 13l6 6 6-6"/></>}
            </svg>
            {sortAsc ? "Menos reciente" : "Más reciente"}
          </button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-lg bg-[#F2ECE6]" />
            ))}
          </div>
        )}

        {/* por estado */}
        {!isLoading && homeTab === "estado" && (
          <div className="flex flex-col gap-10">
            {drafts.length > 0 && (
              <section>
                <div className="mb-5 flex items-baseline gap-3">
                  <h2 className="text-lg font-bold text-[#241A16]">Borradores</h2>
                  <span className="rounded-full bg-[rgba(251,191,36,.18)] px-2 py-0.5 text-xs font-bold text-[#B85806]">
                    {drafts.length}
                  </span>
                  <span className="text-sm text-[#8C817A]">En edición, todavía sin publicar</span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                  {drafts.map((v) => (
                    <CourseCard
                      key={v.id}
                      item={v}
                      onOpen={() => adminApi.courseVersion(v.id).then(openEditor)}
                    />
                  ))}
                </div>
              </section>
            )}
            {published.length > 0 && (
              <section>
                <div className="mb-5 flex items-baseline gap-3">
                  <h2 className="text-lg font-bold text-[#241A16]">Publicados</h2>
                  <span className="rounded-full bg-[rgba(76,166,92,.12)] px-2 py-0.5 text-xs font-bold text-[#2E7D45]">
                    {published.length}
                  </span>
                  <span className="text-sm text-[#8C817A]">La versión activa de cada curso</span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                  {published.map((v) => (
                    <CourseCard
                      key={v.id}
                      item={v}
                      onOpen={() => adminApi.courseVersion(v.id).then(openEditor)}
                      onArchive={() =>
                        setConfirmDialog({
                          title: "¿Archivar este curso?",
                          body: "El curso pasará al archivo y dejará de estar activo para los alumnos.",
                          onConfirm: () => archiveMutation.mutate(v.id),
                        })
                      }
                    />
                  ))}
                </div>
              </section>
            )}
            {archived.length > 0 && (
              <section>
                <div className="mb-5 flex items-baseline gap-3">
                  <h2 className="text-lg font-bold text-[#241A16]">Archivados</h2>
                  <span className="rounded-full bg-[#EBE3DB] px-2 py-0.5 text-xs font-bold text-[#8C817A]">
                    {archived.length}
                  </span>
                  <span className="text-sm text-[#8C817A]">
                    Por fecha de publicación · más recientes primero
                  </span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                  {archived.map((v) => (
                    <CourseCard
                      key={v.id}
                      item={v}
                      onOpen={() => adminApi.courseVersion(v.id).then(openEditor)}
                    />
                  ))}
                </div>
              </section>
            )}
            {allVersions.length === 0 && (
              <div className="rounded-lg border border-dashed border-[#EBE3DB] px-5 py-10 text-center text-sm text-[#8C817A]">
                Todavía no hay cursos. Creá el primero.
              </div>
            )}
          </div>
        )}

        {/* por curso */}
        {!isLoading && homeTab === "curso" && (
          <div className="flex flex-col gap-10">
            {byCourse.map(({ courseName, items }) => (
              <section key={courseName}>
                <div className="mb-5 flex items-baseline gap-3">
                  <h2 className="text-lg font-bold text-[#241A16]">{courseName}</h2>
                  <span className="text-sm text-[#8C817A]">
                    {items.length} versión{items.length !== 1 ? "es" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                  {items.map((v) => (
                    <CourseCard
                      key={v.id}
                      item={v}
                      onOpen={() => adminApi.courseVersion(v.id).then(openEditor)}
                      onArchive={v.status === "PUBLISHED" ? () =>
                        setConfirmDialog({
                          title: "¿Archivar este curso?",
                          body: "El curso pasará al archivo y dejará de estar activo para los alumnos.",
                          onConfirm: () => archiveMutation.mutate(v.id),
                        }) : undefined}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

      {/* confirm dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[rgba(30,23,20,.5)] p-6">
          <div className="flex w-[420px] max-w-full flex-col gap-4 rounded-xl bg-white p-6 shadow-[0_24px_60px_rgba(30,23,20,.25)]">
            <h3 className="font-display text-xl font-bold text-[#241A16]">{confirmDialog.title}</h3>
            <p className="text-sm leading-relaxed text-[#8C817A]">{confirmDialog.body}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="rounded-xl border border-[#ECE5DE] bg-white px-4 py-2.5 text-sm font-semibold text-[#241A16] hover:bg-[#F2ECE6]"
              >
                Cancelar
              </button>
              <button
                onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                className="rounded-xl border-0 bg-[#E14E22] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c43d18]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="fixed right-6 bottom-6 z-70 max-w-[420px] rounded-xl bg-[#241A16] px-4.5 py-3.5 text-sm font-medium text-[#FBF6F2] shadow-[0_12px_32px_rgba(30,23,20,.25)]">
          {toast}
        </div>
      )}
      </div>
    );
  }

  // ─── editor view ─────────────────────────────────────────────────────────────

  const canEdit = ed.status === "DRAFT";
  const issues = publishIssues();

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      {/* sticky top bar */}
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b border-[#ECE5DE] bg-[rgba(250,246,242,.94)] px-8 py-3 backdrop-blur-sm">
        <button
          onClick={goHome}
          className="flex items-center gap-1.5 border-0 bg-transparent px-0 py-1.5 text-sm font-semibold text-[#8C817A] hover:text-[#241A16]"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 5l-7 7 7 7" />
          </svg>
          Cursos
        </button>
        <span className="h-5 w-px bg-[#ECE5DE]" />
        <span className="font-display text-lg font-bold">{ed.name}</span>
        <span
          className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusColors(ed.status))}
        >
          {statusLabel(ed.status)}
        </span>
        <span className="font-mono text-xs text-[#8C817A]">
          v{ed.version}
          {ed.status === "PUBLISHED" && ed.publishedAt
            ? ` · publicada el ${formatDate(ed.publishedAt)}`
            : ed.basedOnVersion
              ? ` · basado en v${ed.basedOnVersion}`
              : ""}
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-4">
          {canEdit && (
            <>
              <span className="flex items-center gap-2 text-sm text-[#8C817A]">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background:
                      saveStatus === "saved"
                        ? "#4CA65C"
                        : saveStatus === "saving"
                          ? "#F59E0B"
                          : "#8C817A",
                  }}
                />
                {saveStatus === "saved"
                  ? "Guardado"
                  : saveStatus === "saving"
                    ? "Guardando…"
                    : "Sin guardar"}
              </span>
              <button
                onClick={() => {
                  if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                  if (!ed) return;
                  setSaveStatus("saving");
                  saveMutation.mutate({ id: ed.id, payload: buildPayload(ed) });
                }}
                disabled={saveMutation.isPending}
                className="rounded-xl border border-[#ECE5DE] bg-white px-4 py-2.5 text-sm font-semibold text-[#241A16] hover:bg-[#F2ECE6] disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                onClick={() => setPublishOpen(true)}
                className="rounded-xl border-0 bg-[#241A16] px-5 py-2.5 text-sm font-semibold text-[#FBF6F2] hover:bg-[#3A2F2A]"
              >
                Publicar
              </button>
              <button
                onClick={() =>
                  setConfirmDialog({
                    title: "¿Eliminar este borrador?",
                    body: "Esta acción no se puede deshacer. El borrador se eliminará permanentemente.",
                    onConfirm: () => deleteDraftMutation.mutate(ed.id),
                  })
                }
                className="rounded-xl border border-[#FBE0D8] bg-[#FBE0D8] px-4 py-2.5 text-sm font-semibold text-[#E14E22] hover:bg-[#f5c9bb]"
              >
                Eliminar borrador
              </button>
            </>
          )}
          {!canEdit && (
            <>
              <span className="flex items-center gap-1.5 text-sm text-[#8C817A]">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Solo lectura
              </span>
              {ed.status === "PUBLISHED" && (
                <button
                  onClick={() =>
                    setConfirmDialog({
                      title: "¿Archivar este curso?",
                      body: "El curso pasará al archivo y dejará de estar activo para los alumnos.",
                      onConfirm: () => archiveMutation.mutate(ed.id),
                    })
                  }
                  disabled={archiveMutation.isPending}
                  className="rounded-xl border border-[#ECE5DE] bg-white px-4 py-2.5 text-sm font-semibold text-[#241A16] hover:bg-[#FBE0D8] hover:text-[#E14E22] disabled:opacity-50"
                >
                  Archivar
                </button>
              )}
              <button
                onClick={() => forkMutation.mutate(ed.id)}
                disabled={forkMutation.isPending}
                className="flex items-center gap-2 rounded-xl border-0 bg-[#241A16] px-4 py-2.5 text-sm font-semibold text-[#FBF6F2] hover:bg-[#3A2F2A] disabled:opacity-50"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z" />
                  <path d="M13.5 6.5l4 4" />
                </svg>
                {ed.status === "PUBLISHED"
                  ? `Abrir borrador v${parseInt(ed.version, 10) + 1}`
                  : `Abrir borrador v${ed.version}`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* editor body */}
      <div className="flex flex-wrap gap-3 px-8 py-6 pb-16">
        {/* course meta card */}
        <div
          className="flex min-w-0 flex-[999_1_420px] flex-col gap-3.5 self-stretch rounded-lg p-6"
          style={{ background: ed.color ?? "#E4F1EC" }}
        >
          <span className="text-[11px] font-bold tracking-widest text-[rgba(36,26,22,.7)] uppercase">
            Curso
          </span>
          <input
            readOnly={!canEdit}
            value={ed.name}
            onChange={(e) =>
              updateEd((d) => {
                d.name = e.target.value;
                return d;
              })
            }
            placeholder="Nombre del curso"
            className="font-display w-full border-0 border-b-2 border-dashed border-[rgba(36,26,22,.15)] bg-transparent pb-1.5 text-4xl font-bold text-[#241A16]"
          />
          <textarea
            readOnly={!canEdit}
            value={ed.description ?? ""}
            onChange={(e) =>
              updateEd((d) => {
                d.description = e.target.value;
                return d;
              })
            }
            placeholder="Descripción breve del curso"
            rows={2}
            className="resize-y rounded-md border-0 bg-[rgba(255,255,255,.55)] px-3 py-2.5 text-[15px] leading-relaxed text-[#241A16]"
          />
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-[rgba(36,26,22,.7)] uppercase">
                Acceso
              </span>
              <div className="flex gap-0.5 rounded-md bg-[rgba(255,255,255,.55)] p-0.5">
                <button
                  onClick={() =>
                    canEdit &&
                    updateEd((d) => {
                      d.isFree = true;
                      d.price = null;
                      return d;
                    })
                  }
                  className={cn(
                    "rounded px-3 py-1.5 text-sm font-semibold",
                    ed.isFree ? "bg-white text-[#241A16]" : "bg-transparent text-[#8C817A]",
                  )}
                >
                  Gratis
                </button>
                <button
                  onClick={() =>
                    canEdit &&
                    updateEd((d) => {
                      d.isFree = false;
                      return d;
                    })
                  }
                  className={cn(
                    "rounded px-3 py-1.5 text-sm font-semibold",
                    !ed.isFree ? "bg-white text-[#241A16]" : "bg-transparent text-[#8C817A]",
                  )}
                >
                  Pago
                </button>
              </div>
            </div>
            {!ed.isFree && (
              <label className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold tracking-wider text-[rgba(36,26,22,.7)] uppercase">
                  Precio ARS
                </span>
                <input
                  readOnly={!canEdit}
                  inputMode="numeric"
                  value={ed.price ?? ""}
                  onChange={(e) =>
                    updateEd((d) => {
                      d.price = Number(e.target.value) || null;
                      return d;
                    })
                  }
                  className="w-32 rounded-md border-0 bg-[rgba(255,255,255,.55)] px-3 py-2 text-sm font-semibold text-[#241A16]"
                />
              </label>
            )}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-[rgba(36,26,22,.7)] uppercase">
                Color
              </span>
              <div className="flex items-center gap-2">
                {["#E4F1EC","#FEF0DE","#FDE8F1","#E4F1FB","#EEE8FF","#E0F4F2","#FBE0D8","#EBE3DB"].map((c) => (
                  <button
                    key={c}
                    onClick={() => canEdit && updateEd((d) => { d.color = c; return d; })}
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      background: c,
                      borderColor: (ed.color ?? "#E4F1EC") === c ? "#241A16" : "transparent",
                    }}
                  />
                ))}
                {canEdit && (
                  <label className="relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-[rgba(36,26,22,.3)] hover:border-[#241A16]" title="Color personalizado">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
                    <input
                      type="color"
                      value={ed.color ?? "#E4F1EC"}
                      onChange={(e) => updateEd((d) => { d.color = e.target.value; return d; })}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* stats card */}
        <div className="flex flex-[1_1_180px] flex-col justify-between gap-2.5 self-stretch rounded-lg bg-[#241A16] p-4.5 text-[#FBF6F2]">
          <span className="text-[11px] font-bold tracking-widest text-[rgba(251,246,242,.55)] uppercase">
            Resumen
          </span>
          {[
            ["Unidades", ed.topics.length],
            ["Lecciones", ed.topics.reduce((s, t) => s + t.lessons.length, 0)],
            [
              "Bloques",
              ed.topics.reduce(
                (s, t) => s + t.lessons.reduce((ls, l) => ls + l.blocks.length, 0),
                0,
              ),
            ],
            ["Señas", countSigns(ed.topics)],
          ].map(([label, val]) => (
            <div key={label as string} className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-[rgba(251,246,242,.65)]">{label}</span>
              <span className="font-display text-[22px] font-bold">{val}</span>
            </div>
          ))}
        </div>

        {/* unit tabs */}
        <div className="flex w-full min-w-0 gap-2.5 overflow-x-auto py-3">
          {ed.topics.map((t, ti) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTopicIdx(ti);
                setSelectedLessonIdx(0);
              }}
              className={cn(
                "flex h-auto w-46 shrink-0 flex-col gap-1 rounded-lg px-3.5 py-3.5 text-left",
                UNIT_TINTS[ti % UNIT_TINTS.length],
                ti === selectedTopicIdx
                  ? "outline outline-2 outline-offset-[-2px] outline-[#241A16]"
                  : "opacity-70",
              )}
            >
              <span className="text-[11px] font-bold tracking-wider text-[rgba(36,26,22,.7)] uppercase">
                {t.title || `Unidad ${ti}`}
              </span>
              <span className="font-display text-[17px] leading-tight font-bold text-[#241A16]">
                {t.subtitle || "Sin subtítulo"}
              </span>
              <span className="mt-1.5 text-xs text-[rgba(36,26,22,.7)]">
                {t.lessons.length} lección{t.lessons.length !== 1 ? "es" : ""}
              </span>
            </button>
          ))}
          {canEdit && (
            <button
              onClick={addUnit}
              className="flex h-auto w-36 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#D9CFC5] bg-transparent text-sm font-semibold text-[#8C817A] hover:border-[#241A16] hover:text-[#241A16]"
            >
              + Unidad
            </button>
          )}
        </div>

        {/* unit editor */}
        {topic && (
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2.5">
            <div
              className={cn(
                "flex flex-col gap-2.5 rounded-lg p-4.5",
                UNIT_TINTS[selectedTopicIdx % UNIT_TINTS.length],
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold tracking-wider text-[rgba(36,26,22,.7)] uppercase">
                  Unidad
                </span>
                {canEdit && ed.topics.length > 1 && (
                  <button
                    onClick={deleteUnit}
                    className="flex items-center gap-1.5 rounded-md border-0 bg-[rgba(255,255,255,.6)] px-2 py-1 text-xs font-semibold text-[#241A16] hover:bg-[#FBE0D8] hover:text-[#E14E22]"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                    </svg>
                    Eliminar unidad
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  readOnly={!canEdit}
                  value={topic.title}
                  onChange={(e) => setTopicField("title", e.target.value)}
                  placeholder="Título"
                  className="w-28 rounded-md border-0 bg-[rgba(255,255,255,.6)] px-2.5 py-2 text-sm font-semibold text-[#241A16]"
                />
                <input
                  readOnly={!canEdit}
                  value={topic.subtitle ?? ""}
                  onChange={(e) => setTopicField("subtitle", e.target.value)}
                  placeholder="Subtítulo"
                  className="font-display min-w-0 flex-1 rounded-md border-0 bg-[rgba(255,255,255,.6)] px-2.5 py-2 text-base font-bold text-[#241A16]"
                />
              </div>
              <textarea
                readOnly={!canEdit}
                value={topic.description ?? ""}
                rows={2}
                onChange={(e) => setTopicField("description", e.target.value)}
                placeholder="Descripción de la unidad"
                className="resize-y rounded-md border-0 bg-[rgba(255,255,255,.6)] px-2.5 py-2 text-sm leading-snug text-[#241A16]"
              />
            </div>

            <span className="mt-1.5 text-[11px] font-bold tracking-wider text-[#8C817A] uppercase">
              Lecciones
            </span>
            {topic.lessons.map((l, li) => (
              <div
                key={l.id}
                onClick={() => setSelectedLessonIdx(li)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5",
                  li === selectedLessonIdx
                    ? "border-[#241A16] bg-white"
                    : "border-[#ECE5DE] bg-white hover:bg-[#FAF6F2]",
                )}
              >
                <span className="font-mono text-xs text-[#8C817A]">
                  {String(li + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 truncate text-sm font-semibold text-[#241A16]">
                  {l.name}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    l.blocks.length === 0 ? "text-[#E14E22]" : "text-[#8C817A]",
                  )}
                >
                  {l.blocks.length} blq
                </span>
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLesson(li);
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent text-[#8C817A] hover:bg-[#FBE0D8] hover:text-[#E14E22]"
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {canEdit && (
              <button
                onClick={addLesson}
                className="rounded-lg border border-dashed border-[#D9CFC5] bg-transparent px-3 py-3 text-sm font-semibold text-[#8C817A] hover:border-[#241A16] hover:text-[#241A16]"
              >
                + Lección
              </button>
            )}
          </div>
        )}

        {/* lesson + blocks editor */}
        {lesson && (
          <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
            <div className="flex flex-col gap-2 rounded-lg border border-[#ECE5DE] bg-white p-4.5">
              <span className="text-[11px] font-bold tracking-wider text-[#8C817A] uppercase">
                Lección {selectedLessonIdx + 1} · {lesson.blocks.length} blq
              </span>
              <input
                readOnly={!canEdit}
                value={lesson.name}
                onChange={(e) => setLessonField("name", e.target.value)}
                placeholder="Nombre de la lección"
                className="font-display border-0 border-b-2 border-dashed border-[#ECE5DE] bg-transparent pb-1.5 text-2xl font-bold text-[#241A16]"
              />
              <input
                readOnly={!canEdit}
                value={lesson.description ?? ""}
                onChange={(e) => setLessonField("description", e.target.value)}
                placeholder="Descripción de la lección"
                className="border-0 bg-transparent py-1 text-sm text-[#241A16]"
              />
            </div>

            {lesson.blocks.length === 0 && (
              <div className="rounded-lg border border-dashed border-[#D9CFC5] px-7 py-7 text-center text-sm text-[#8C817A]">
                Esta lección no tiene bloques aún. Toda lección necesita al menos uno para
                publicarse.
              </div>
            )}

            <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] items-start gap-3">
              {lesson.blocks.map((block, bi) => {
                const def = BLOCK_TYPES[block.type];
                return (
                  <div
                    key={block.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-lg p-4",
                      def?.bg ?? "bg-[#F2ECE6]",
                      def?.wide ? "col-span-full" : "",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-[rgba(36,26,22,.6)]">
                        {String(bi + 1).padStart(2, "0")}
                      </span>
                      <span className="text-xs font-bold tracking-wide text-[#241A16] uppercase">
                        {def?.label ?? block.type}
                      </span>
                      <div className="ml-auto flex items-center gap-1">
                        {def?.xp && (
                          <label className="flex items-center gap-1 rounded-md bg-[rgba(255,255,255,.6)] px-1.5 py-0.5 text-[11px] font-bold text-[rgba(36,26,22,.7)]">
                            XP
                            <input
                              readOnly={!canEdit}
                              value={block.xpReward ?? ""}
                              onChange={(e) =>
                                updateEd((d) => {
                                  d.topics[selectedTopicIdx]!.lessons[selectedLessonIdx]!.blocks[
                                    bi
                                  ]!.xpReward = Number(e.target.value) || null;
                                  return d;
                                })
                              }
                              className="w-8 border-0 bg-transparent text-right text-xs font-bold text-[#241A16]"
                            />
                          </label>
                        )}
                        {canEdit && (
                          <>
                            <button
                              onClick={() => moveBlock(bi, -1)}
                              disabled={bi === 0}
                              className="flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent text-[rgba(36,26,22,.6)] hover:bg-[rgba(255,255,255,.7)] hover:text-[#241A16] disabled:opacity-30"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 19V5M6 11l6-6 6 6" />
                              </svg>
                            </button>
                            <button
                              onClick={() => moveBlock(bi, 1)}
                              disabled={bi === lesson.blocks.length - 1}
                              className="flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent text-[rgba(36,26,22,.6)] hover:bg-[rgba(255,255,255,.7)] hover:text-[#241A16] disabled:opacity-30"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 5v14M6 13l6 6 6-6" />
                              </svg>
                            </button>
                            <button
                              onClick={() => deleteBlock(bi)}
                              className="flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent text-[rgba(36,26,22,.6)] hover:bg-[#FBE0D8] hover:text-[#E14E22]"
                            >
                              <svg
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                              >
                                <path d="M6 6l12 12M18 6L6 18" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {(def?.fields ?? []).map(([fieldKey, fieldType, fieldLabel]) => (
                      <BlockField
                        key={fieldKey}
                        fieldDef={[fieldKey, fieldType, fieldLabel]}
                        value={block.config[fieldKey]}
                        readOnly={!canEdit}
                        onChange={(v) => setBlockConfigField(bi, fieldKey, v)}
                        onPickSign={(currentMeaning) =>
                          openSignPicker(
                            {
                              topicIdx: selectedTopicIdx,
                              lessonIdx: selectedLessonIdx,
                              blockIdx: bi,
                              field: fieldKey,
                              multi: false,
                            },
                            currentMeaning,
                          )
                        }
                        onPickSigns={() =>
                          openSignPicker({
                            topicIdx: selectedTopicIdx,
                            lessonIdx: selectedLessonIdx,
                            blockIdx: bi,
                            field: fieldKey,
                            multi: true,
                          })
                        }
                      />
                    ))}
                  </div>
                );
              })}

              {canEdit && !adding && (
                <button
                  onClick={() => setAdding(true)}
                  className="min-h-[120px] rounded-lg border border-dashed border-[#D9CFC5] bg-transparent text-sm font-semibold text-[#8C817A] hover:border-[#241A16] hover:text-[#241A16]"
                >
                  + Agregar bloque
                </button>
              )}
            </div>

            {adding && (
              <div className="flex flex-col gap-3 rounded-lg border border-[#ECE5DE] bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Elegí el tipo de bloque</span>
                  <button
                    onClick={() => setAdding(false)}
                    className="border-0 bg-transparent text-sm font-semibold text-[#8C817A]"
                  >
                    Cancelar
                  </button>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-2">
                  {Object.entries(BLOCK_TYPES).map(([typeKey, def]) => (
                    <button
                      key={typeKey}
                      onClick={() => addBlock(typeKey)}
                      className={cn(
                        "flex flex-col gap-1 rounded-md border-0 p-3 text-left hover:shadow-[0_0_0_2px_#241A16]",
                        def.bg,
                      )}
                    >
                      <span className="text-sm font-bold text-[#241A16]">{def.label}</span>
                      <span className="font-mono text-[10px] text-[rgba(36,26,22,.6)]">
                        {typeKey}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* sign search drawer */}
      {drawerOpen && (
        <>
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-40 bg-[rgba(30,23,20,.35)]"
          />
          <aside className="fixed top-0 right-0 bottom-0 z-50 flex w-[440px] max-w-full flex-col bg-white shadow-[-12px_0_40px_rgba(30,23,20,.15)]">
            <div className="flex flex-col gap-3 border-b border-[#ECE5DE] px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold">Buscar seña</h3>
                  <p className="mt-0.5 text-sm text-[#8C817A]">
                    {drawerTarget?.multi ? "Seleccioná una o más señas" : "Seleccioná una seña"}
                  </p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border-0 bg-[#F2ECE6] text-[#241A16]"
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              <label className="flex items-center gap-2 rounded-xl border border-[#ECE5DE] bg-white px-3.5">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8C817A"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <circle cx="11" cy="11" r="6.5" />
                  <path d="M16 16l4.5 4.5" />
                </svg>
                <input
                  autoFocus
                  value={signQuery}
                  onChange={(e) => setSignQuery(e.target.value)}
                  placeholder="Buscar por significado…"
                  className="flex-1 border-0 py-2.5 text-sm text-[#241A16] outline-none"
                />
              </label>
            </div>

            {pickedSign && (
              <div className="flex flex-col gap-2.5 border-b border-[#ECE5DE] px-6 py-4">
                {pickedSign.animationFormat === "mp4" ? (
                  <div className="flex gap-2">
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-wider text-[#8C817A] uppercase">Frontal</span>
                      <div className="flex h-44 items-center justify-center overflow-hidden rounded-lg bg-[#1E1714]">
                        {signAnimationUrl ? (
                          <video key={signAnimationUrl} src={signAnimationUrl} autoPlay loop muted playsInline controls className="h-full w-full object-contain" />
                        ) : (
                          <span className="font-mono text-xs text-[rgba(255,255,255,.4)]">Cargando…</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-[10px] font-bold tracking-wider text-[#8C817A] uppercase">Lateral</span>
                      <div className="flex h-44 items-center justify-center overflow-hidden rounded-lg bg-[#1E1714]">
                        {signLateralUrl ? (
                          <video key={signLateralUrl} src={signLateralUrl} autoPlay loop muted playsInline controls className="h-full w-full object-contain" />
                        ) : (
                          <span className="font-mono text-xs text-[rgba(255,255,255,.4)]">Sin lateral</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-44 items-center justify-center overflow-hidden rounded-lg bg-[#1E1714]">
                    {signAnimationUrl ? (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <span className="font-mono text-[11px] font-bold text-[#EEE8FF]">GLB</span>
                        <span className="max-w-[200px] text-xs leading-snug text-[rgba(255,255,255,.6)]">
                          Animación 3D — se reproduce en la app.
                        </span>
                        <a
                          href={signAnimationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-md bg-[rgba(255,255,255,.12)] px-3 py-1.5 text-xs font-semibold text-[#EEE8FF] hover:bg-[rgba(255,255,255,.2)]"
                        >
                          Abrir archivo
                        </a>
                      </div>
                    ) : (
                      <span className="font-mono text-xs text-[rgba(255,255,255,.4)]">Cargando…</span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-[22px] font-bold">{pickedSign.meaning}</p>
                    <p className="text-xs text-[#8C817A]">
                      {pickedSign.handedness === "ONE_HANDED" ? "Una mano" : "Dos manos"}
                    </p>
                  </div>
                  <button
                    onClick={usePicked}
                    className="rounded-xl border-0 bg-[#241A16] px-4 py-2.5 text-sm font-semibold whitespace-nowrap text-[#FBF6F2] hover:bg-[#3A2F2A]"
                  >
                    Usar en el bloque
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-3">
              {signQuery.length === 0 && (
                <p className="mx-2 mt-3 text-sm leading-relaxed text-[#8C817A]">
                  Escribí el significado de la seña. Solo se pueden usar señas que ya tienen
                  animación.
                </p>
              )}
              {signQuery.length > 0 && signSearchQuery.isLoading && (
                <p className="mx-2 mt-3 text-sm text-[#8C817A]">Buscando…</p>
              )}
              {signQuery.length > 0 &&
                !signSearchQuery.isLoading &&
                signSearchQuery.data?.content.filter((s) => s.hasAnimation).length === 0 && (
                  <div className="mx-2 mt-2 rounded-lg bg-[#FBE0D8] px-4 py-3.5">
                    <p className="text-sm font-bold text-[#241A16]">
                      No existe &ldquo;{signQuery}&rdquo; en R2
                    </p>
                    <p className="mt-1 text-sm leading-snug text-[#241A16]">
                      Subí la animación o el video de la seña al bucket y volvé a buscarla.
                    </p>
                  </div>
                )}
              {signSearchQuery.data?.content
                .filter((s) => s.hasAnimation)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => pickSignAndFetchAnimation(s)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border-0 px-2.5 py-2.5 text-left",
                      pickedSign?.id === s.id
                        ? "bg-[#EEE8FF]"
                        : "bg-transparent hover:bg-[#F2ECE6]",
                    )}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[#1E1714] font-mono text-[10px] font-bold text-white">
                      {s.animationFormat?.toUpperCase() ?? "GLB"}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-[15px] font-semibold text-[#241A16]">{s.meaning}</span>
                      <span className="text-xs text-[#8C817A]">
                        {s.handedness === "ONE_HANDED" ? "Una mano" : "Dos manos"}
                      </span>
                    </span>
                  </button>
                ))}
            </div>
          </aside>
        </>
      )}

      {/* publish modal */}
      {publishOpen && ed && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[rgba(30,23,20,.5)] p-6">
          <div className="flex max-h-[calc(100vh-48px)] w-[540px] max-w-full flex-col gap-4.5 overflow-y-auto rounded-xl bg-white p-7 shadow-[0_24px_60px_rgba(30,23,20,.25)]">
            <div>
              <h3
                className="font-display text-2xl font-bold"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                ¿Publicar {ed.name}?
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#8C817A]">
                Los alumnos van a ver esta versión desde el momento en que la publiques.
              </p>
            </div>

            <div
              className={cn(
                "grid gap-2 rounded-lg p-3.5",
                UNIT_TINTS[0],
                "grid-cols-[repeat(auto-fit,minmax(78px,1fr))]",
              )}
            >
              {[
                ["Unidades", ed.topics.length],
                ["Lecciones", ed.topics.reduce((s, t) => s + t.lessons.length, 0)],
                [
                  "Bloques",
                  ed.topics.reduce(
                    (s, t) => s + t.lessons.reduce((ls, l) => ls + l.blocks.length, 0),
                    0,
                  ),
                ],
                ["Señas", countSigns(ed.topics)],
              ].map(([label, val]) => (
                <div key={label as string}>
                  <p className="font-display text-[22px] font-bold">{val}</p>
                  <p className="text-[11px] font-semibold tracking-wider text-[rgba(36,26,22,.7)] uppercase">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 text-sm leading-snug">
              <div className="flex gap-2.5">
                <span className="w-28 shrink-0 text-[#8C817A]">Acceso</span>
                <span>{ed.isFree ? "Gratis" : `$${ed.price?.toLocaleString("es-AR") ?? "—"}`}</span>
              </div>
              <div className="flex gap-2.5">
                <span className="w-28 shrink-0 text-[#8C817A]">Al publicar</span>
                <span>La versión publicada actual pasará a Archivada.</span>
              </div>
            </div>

            {issues.length > 0 && (
              <div className="flex flex-col gap-2 rounded-lg bg-[#FBE0D8] px-4 py-3.5">
                <span className="text-sm font-bold text-[#241A16]">
                  Resolvé esto antes de publicar
                </span>
                {issues.map((issue, i) => (
                  <div
                    key={i}
                    className="flex justify-between gap-3 rounded-md bg-[rgba(255,255,255,.6)] px-2.5 py-2 text-sm text-[#241A16]"
                  >
                    {issue.text}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPublishOpen(false)}
                className="rounded-xl border border-[#ECE5DE] bg-white px-4 py-2.5 text-sm font-semibold text-[#241A16] hover:bg-[#F2ECE6]"
              >
                Cancelar
              </button>
              <button
                onClick={() => publishMutation.mutate(ed.id)}
                disabled={issues.length > 0 || publishMutation.isPending}
                className="rounded-xl border-0 bg-[#241A16] px-5 py-2.5 text-sm font-semibold text-[#FBF6F2] hover:bg-[#3A2F2A] disabled:opacity-40"
              >
                {publishMutation.isPending ? "Publicando…" : "Sí, publicar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* confirm dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-[rgba(30,23,20,.5)] p-6">
          <div className="flex w-[420px] max-w-full flex-col gap-4 rounded-xl bg-white p-6 shadow-[0_24px_60px_rgba(30,23,20,.25)]">
            <h3 className="font-display text-xl font-bold text-[#241A16]">{confirmDialog.title}</h3>
            <p className="text-sm leading-relaxed text-[#8C817A]">{confirmDialog.body}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="rounded-xl border border-[#ECE5DE] bg-white px-4 py-2.5 text-sm font-semibold text-[#241A16] hover:bg-[#F2ECE6]"
              >
                Cancelar
              </button>
              <button
                onClick={() => { confirmDialog.onConfirm(); setConfirmDialog(null); }}
                className="rounded-xl border-0 bg-[#E14E22] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#c43d18]"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="fixed right-6 bottom-6 z-70 max-w-[420px] rounded-xl bg-[#241A16] px-4.5 py-3.5 text-sm font-medium text-[#FBF6F2] shadow-[0_12px_32px_rgba(30,23,20,.25)]">
          {toast}
        </div>
      )}
    </div>
  );
}

// ─── course card ──────────────────────────────────────────────────────────────

function CourseCard({
  item,
  onOpen,
  onArchive,
}: {
  item: AdminCourseVersionListItem;
  onOpen: () => void;
  onArchive?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const defaultTint =
    UNIT_TINTS[
      Math.abs(item.courseName.split("").reduce((h, c) => h * 31 + c.charCodeAt(0), 0)) %
        UNIT_TINTS.length
    ]!;
  const tintStyle =
    item.status === "ARCHIVED"
      ? { background: "#F0EFEE" }
      : item.color
        ? { background: item.color }
        : undefined;
  const tintClass = tintStyle ? undefined : defaultTint;

  const hoverLabel =
    item.status === "DRAFT" ? "Seguir editando en el editor visual" : "Ver en el editor visual";

  const initials = item.updatedBy
    ? (item.updatedBy
        .split("@")[0]
        ?.split(/[._-]/)
        .map((s) => s[0]?.toUpperCase() ?? "")
        .slice(0, 2)
        .join("") ?? "?")
    : "";

  return (
    <article
      onClick={onOpen}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-white transition-all duration-200",
        hovered
          ? "translate-y-[-2px] border-[#241A16] shadow-[0_8px_28px_rgba(36,26,22,.14)]"
          : "border-[#ECE5DE] shadow-none",
      )}
    >
      {/* tinted header */}
      <div className={cn("flex flex-col gap-3 p-4 pb-3.5", tintClass)} style={tintStyle}>
        {/* badges row */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              statusColors(item.status),
            )}
          >
            {statusLabel(item.status)}
          </span>
          <span className="font-mono text-xs font-semibold text-[#241A16]">v{item.version}</span>
          {item.basedOnVersion && (
            <span className="font-mono text-xs text-[rgba(36,26,22,.5)]">
              · basado en v{item.basedOnVersion}
            </span>
          )}
          {/* action icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen();
            }}
            className={cn(
              "ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[rgba(36,26,22,.1)] transition-colors",
              hovered ? "bg-[#241A16] text-white" : "bg-white text-[#241A16]",
            )}
          >
            {item.status === "DRAFT" ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4z" />
                <path d="M13.5 6.5l4 4" />
              </svg>
            ) : (
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {/* course name */}
        <h3 className="font-display text-[26px] leading-[1.08] font-bold text-[#241A16]">
          {item.courseName}
        </h3>

        {/* hover CTA */}
        <div
          className="flex items-center gap-1.5 text-sm font-semibold text-[#241A16]"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(4px)",
            transition: "opacity .2s, transform .2s",
          }}
        >
          {hoverLabel}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: hovered ? "translateX(3px)" : "translateX(0)",
              transition: "transform .25s",
            }}
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </div>
      </div>

      {/* stats + footer */}
      <div className="flex flex-1 flex-col gap-3.5 p-4">
        {/* stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            [item.unitCount, "Unidades"],
            [item.lessonCount, "Lecciones"],
            [item.blockCount, "Bloques"],
            [item.signCount, "Señas"],
          ].map(([val, label]) => (
            <div key={label as string}>
              <p className="font-display text-xl font-bold text-[#241A16]">{val}</p>
              <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-[#8C817A] uppercase">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* footer */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-[#ECE5DE] pt-3">
          {/* left side */}
          {item.status === "DRAFT" && (
            <div className="flex min-w-0 items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EEE8FF] text-[10px] font-bold text-[#5E3ED1]">
                {initials || "?"}
              </span>
              <span className="text-xs whitespace-nowrap text-[#8C817A]">
                {formatAgo(item.updatedAt)}
              </span>
            </div>
          )}
          {item.status === "PUBLISHED" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8C817A]">
                Publicada el {formatDate(item.publishedAt)}
              </span>
              {onArchive && (
                <button
                  onClick={(e) => { e.stopPropagation(); onArchive(); }}
                  className="rounded-md border border-[#ECE5DE] bg-white px-2 py-1 text-xs font-semibold text-[#8C817A] hover:border-[#241A16] hover:text-[#241A16]"
                >
                  Archivar
                </button>
              )}
            </div>
          )}
          {item.status === "ARCHIVED" && (
            <span className="text-xs text-[#8C817A]">Publicada {formatDate(item.publishedAt)}</span>
          )}

          {/* price */}
          <span className="font-display shrink-0 text-lg font-bold text-[#241A16]">
            {priceLabel(item)}
          </span>
        </div>
      </div>
    </article>
  );
}

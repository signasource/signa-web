"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { BLOCK_TYPES, blockConfigIssues } from "@/lib/course-blocks";
import { findLesson, pickVersionForCourse } from "@/lib/course-deep-link";
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

const UNIT_TINTS = [
  "bg-course-teal-light",
  "bg-shop-amber-light",
  "bg-avatar-wine-light",
  "bg-avatar-blue-light",
  "bg-avatar-green-light",
  "bg-primary-light",
  "bg-avatar-teal-light",
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
  if (status === "DRAFT") return "bg-warning/18 text-shop-amber-dark";
  if (status === "PUBLISHED") return "bg-success/12 text-success-dark";
  return "bg-fill-dark text-text-muted";
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

  const signMeaning = fieldType === "sign" && typeof value === "string" ? (value as string) : null;
  const { data: signSearchPage } = useQuery({
    queryKey: ["admin", "sign-by-meaning", signMeaning],
    queryFn: () => adminApi.signs({ query: signMeaning!, size: 10 }),
    enabled: !!signMeaning,
    staleTime: 5 * 60_000,
  });
  const signId = signSearchPage?.content.find((s) => s.meaning === signMeaning)?.id ?? null;
  const { data: signDetail } = useQuery({
    queryKey: ["admin", "signs", signId],
    queryFn: () => adminApi.sign(signId!),
    enabled: !!signId,
    staleTime: 5 * 60_000,
  });

  if (fieldType === "text") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-text/70 text-[11px] font-semibold tracking-wider uppercase">
          {label}
        </span>
        <input
          readOnly={readOnly}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          className="bg-surface/65 text-text w-full rounded-md border-0 px-2.5 py-2 text-sm"
        />
      </div>
    );
  }

  if (fieldType === "textarea") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-text/70 text-[11px] font-semibold tracking-wider uppercase">
          {label}
        </span>
        <textarea
          readOnly={readOnly}
          value={typeof value === "string" ? value : ""}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className="bg-surface/65 text-text w-full resize-y rounded-md border-0 px-2.5 py-2 text-sm leading-relaxed"
        />
      </div>
    );
  }

  if (fieldType === "number") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-text/70 text-[11px] font-semibold tracking-wider uppercase">
          {label}
        </span>
        <input
          readOnly={readOnly}
          inputMode="numeric"
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className="bg-surface/65 text-text w-20 rounded-md border-0 px-2.5 py-2 text-sm font-semibold"
        />
      </div>
    );
  }

  if (fieldType === "toggle") {
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-text/70 text-[11px] font-semibold tracking-wider uppercase">
          {label}
        </span>
        <button
          onClick={() => !readOnly && onChange(!value)}
          className="relative h-6 w-10 rounded-full border-0 p-0"
          style={{ background: value ? "var(--color-text)" : "var(--color-border-strong)" }}
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
    const mediaUrl = signDetail?.mediaUrl ?? null;
    const mediaFormat = signDetail?.animationFormat ?? null;
    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-text/70 text-[11px] font-semibold tracking-wider uppercase">
          {label}
        </span>
        {meaning ? (
          <div className="rounded-md bg-white hover:shadow-[0_0_0_2px_var(--color-text)]">
            {mediaFormat === "glb" && mediaUrl ? (
              <div className="h-40 overflow-hidden rounded-t-md">
                <iframe
                  key={mediaUrl}
                  src={`/api/glb-viewer/file?src=${encodeURIComponent(mediaUrl)}`}
                  title={`Animación 3D de ${meaning}`}
                  className="h-full w-full border-0"
                />
              </div>
            ) : mediaFormat === "mp4" && mediaUrl ? (
              <video
                key={mediaUrl}
                src={mediaUrl}
                autoPlay
                loop
                muted
                playsInline
                className="bg-ink-900 h-40 w-full rounded-t-md object-contain"
              />
            ) : null}
            <button
              onClick={() => onPickSign(meaning)}
              className="flex w-full cursor-pointer items-center gap-2.5 border-0 bg-transparent p-1.5 text-left"
            >
              {!mediaUrl && (
                <span className="bg-ink-900 flex h-11 w-11 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold text-white">
                  {mediaFormat?.toUpperCase() ?? "…"}
                </span>
              )}
              <span className="flex flex-1 flex-col gap-0.5">
                <span className="text-text text-[15px] font-bold">{meaning}</span>
              </span>
              <span className="text-primary pr-1.5 text-xs font-semibold">Cambiar</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => onPickSign()}
            className="border-text/25 bg-surface/40 text-text/75 hover:border-text hover:text-text flex items-center gap-2 rounded-md border border-dashed px-3 py-3.5 text-sm font-semibold"
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
        <span className="text-text/70 text-[11px] font-semibold tracking-wider uppercase">
          {label}
        </span>
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip, i) => (
            <span
              key={i}
              className="text-text flex items-center gap-1.5 rounded-md bg-white px-1 py-0.5 text-sm font-semibold"
            >
              {!isWords && (
                <span className="bg-ink-900 rounded px-1 py-0.5 font-mono text-[9px] font-bold text-white">
                  GLB
                </span>
              )}
              <span className="px-0.5">{chip}</span>
              {!readOnly && (
                <button
                  onClick={() => onChange(chips.filter((_, j) => j !== i))}
                  className="text-text-muted hover:bg-fill hover:text-text flex h-5 w-5 items-center justify-center rounded border-0 bg-transparent"
                >
                  ×
                </button>
              )}
            </span>
          ))}
          {!readOnly && !isWords && (
            <button
              onClick={onPickSigns}
              className="border-text/25 text-text/75 hover:border-text hover:text-text rounded-md border border-dashed bg-transparent px-2.5 py-1 text-sm font-semibold"
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
              className="border-text/25 text-text w-28 rounded-md border border-dashed bg-transparent px-2.5 py-1 text-sm"
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
        saveTimerRef.current = null;
        setSaveStatus("saving");
        const payload = buildPayload(draft);
        saveMutation.mutate({ id: draft.id, payload });
      }, 1500);
    },
    [saveMutation],
  );

  function openEditor(detail: AdminCourseVersionDetail, lessonId?: string | null) {
    const at = lessonId ? findLesson(detail, lessonId) : null;
    setEd(detail);
    setSelectedTopicIdx(at?.topic ?? 0);
    setSelectedLessonIdx(at?.lesson ?? 0);
    setAdding(false);
    setSaveStatus("saved");
    setView("editor");
  }

  // Deep link (sign editor "Abrir lección", usage dashboard): `?course=<id>&lesson=<id>` opens that
  // lesson in the course's published version (or its latest); `&version=<id>` picks the exact
  // version instead. Consumed once.
  const deepLinkDone = useRef(false);
  useEffect(() => {
    if (deepLinkDone.current || !versions) return;
    const params = new URLSearchParams(window.location.search);
    const courseId = params.get("course");
    if (!courseId) return;
    deepLinkDone.current = true;
    const versionId =
      versions.find((v) => v.id === params.get("version") && v.courseId === courseId)?.id ??
      pickVersionForCourse(versions, courseId)?.id;
    if (!versionId) return;
    void adminApi
      .courseVersion(versionId)
      .then((detail) => openEditor(detail, params.get("lesson")));
    // openEditor only sets state; running once when the versions arrive is the intent.
  }, [versions]);

  function goHome() {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (ed && ed.status === "DRAFT" && saveStatus === "unsaved") {
      saveMutation.mutate({ id: ed.id, payload: buildPayload(ed) });
    }
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
    // The sign's own media URLs (front + lateral for .mp4 signs), managed in /admin/signs.
    adminApi
      .sign(sign.id)
      .then((detail) => {
        setSignAnimationUrl(detail.mediaUrl);
        setSignLateralUrl(detail.lateralMediaUrl);
      })
      .catch(() => setSignAnimationUrl(null));
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
        const where = `Unidad ${ti + 1} · Lección ${li + 1}`;
        if (l.blocks.length === 0) issues.push({ text: `${where} no tiene bloques.` });
        l.blocks.forEach((b, bi) => {
          blockConfigIssues(b.type, b.config).forEach((problem) =>
            issues.push({ text: `${where} · Bloque ${bi + 1}: ${problem}` }),
          );
        });
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
            <h1 className="font-display text-text mb-2 text-2xl font-bold">Cursos</h1>
            <p className="text-text-muted max-w-xl text-sm">
              Borradores, versiones publicadas y archivo de cada curso. Los borradores se guardan
              solos y los ven todos los administradores.
            </p>
          </div>
          <button
            onClick={() => createMutation.mutate("Nuevo curso")}
            disabled={createMutation.isPending}
            className="bg-text text-on-dark hover:bg-ink-700 flex items-center gap-2 rounded-xl border-0 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
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
          <div className="bg-fill flex w-fit gap-1 rounded-xl p-1">
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
                    ? "text-text bg-white shadow-sm"
                    : "text-text-muted hover:text-text bg-transparent",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSortAsc((v) => !v)}
            className="border-border text-text hover:bg-fill flex items-center gap-1.5 rounded-xl border bg-white px-3.5 py-2 text-sm font-semibold"
          >
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
              {sortAsc ? (
                <>
                  <path d="M12 19V5" />
                  <path d="M6 11l6-6 6 6" />
                </>
              ) : (
                <>
                  <path d="M12 5v14" />
                  <path d="M6 13l6 6 6-6" />
                </>
              )}
            </svg>
            {sortAsc ? "Menos reciente" : "Más reciente"}
          </button>
        </div>

        {isLoading && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-fill h-56 animate-pulse rounded-lg" />
            ))}
          </div>
        )}

        {/* por estado */}
        {!isLoading && homeTab === "estado" && (
          <div className="flex flex-col gap-10">
            {drafts.length > 0 && (
              <section>
                <div className="mb-5 flex items-baseline gap-3">
                  <h2 className="text-text text-lg font-bold">Borradores</h2>
                  <span className="bg-warning/18 text-shop-amber-dark rounded-full px-2 py-0.5 text-xs font-bold">
                    {drafts.length}
                  </span>
                  <span className="text-text-muted text-sm">En edición, todavía sin publicar</span>
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
                  <h2 className="text-text text-lg font-bold">Publicados</h2>
                  <span className="bg-success/12 text-success-dark rounded-full px-2 py-0.5 text-xs font-bold">
                    {published.length}
                  </span>
                  <span className="text-text-muted text-sm">La versión activa de cada curso</span>
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
                  <h2 className="text-text text-lg font-bold">Archivados</h2>
                  <span className="bg-fill-dark text-text-muted rounded-full px-2 py-0.5 text-xs font-bold">
                    {archived.length}
                  </span>
                  <span className="text-text-muted text-sm">
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
              <div className="border-fill-dark text-text-muted rounded-lg border border-dashed px-5 py-10 text-center text-sm">
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
                  <h2 className="text-text text-lg font-bold">{courseName}</h2>
                  <span className="text-text-muted text-sm">
                    {items.length} versión{items.length !== 1 ? "es" : ""}
                  </span>
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                  {items.map((v) => (
                    <CourseCard
                      key={v.id}
                      item={v}
                      onOpen={() => adminApi.courseVersion(v.id).then(openEditor)}
                      onArchive={
                        v.status === "PUBLISHED"
                          ? () =>
                              setConfirmDialog({
                                title: "¿Archivar este curso?",
                                body: "El curso pasará al archivo y dejará de estar activo para los alumnos.",
                                onConfirm: () => archiveMutation.mutate(v.id),
                              })
                          : undefined
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* confirm dialog */}
        {confirmDialog && (
          <div className="bg-ink-900/50 fixed inset-0 z-60 flex items-center justify-center p-6">
            <div className="flex w-[420px] max-w-full flex-col gap-4 rounded-xl bg-white p-6 shadow-[0_24px_60px_rgba(30,23,20,.25)]">
              <h3 className="font-display text-text text-xl font-bold">{confirmDialog.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{confirmDialog.body}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDialog(null)}
                  className="border-border text-text hover:bg-fill rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                  className="bg-danger hover:bg-danger-dark rounded-xl border-0 px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* toast */}
        {toast && (
          <div className="bg-text text-on-dark fixed right-6 bottom-6 z-70 max-w-[420px] rounded-xl px-4.5 py-3.5 text-sm font-medium shadow-[0_12px_32px_rgba(30,23,20,.25)]">
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
      <div className="border-border bg-background/94 sticky top-0 z-20 flex flex-wrap items-center gap-4 border-b px-8 py-3 backdrop-blur-sm">
        <button
          onClick={goHome}
          className="text-text-muted hover:text-text flex items-center gap-1.5 border-0 bg-transparent px-0 py-1.5 text-sm font-semibold"
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
        <span className="bg-border h-5 w-px" />
        <span className="font-display text-lg font-bold">{ed.name}</span>
        <span
          className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", statusColors(ed.status))}
        >
          {statusLabel(ed.status)}
        </span>
        <span className="text-text-muted font-mono text-xs">
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
              <span className="text-text-muted flex items-center gap-2 text-sm">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    background:
                      saveStatus === "saved"
                        ? "var(--color-success)"
                        : saveStatus === "saving"
                          ? "var(--color-warning-strong)"
                          : "var(--color-text-muted)",
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
                className="border-border text-text hover:bg-fill rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                onClick={() => setPublishOpen(true)}
                className="bg-text text-on-dark hover:bg-ink-700 rounded-xl border-0 px-5 py-2.5 text-sm font-semibold"
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
                className="border-danger-light bg-danger-light text-danger hover:bg-danger-border rounded-xl border px-4 py-2.5 text-sm font-semibold"
              >
                Eliminar borrador
              </button>
            </>
          )}
          {!canEdit && (
            <>
              <span className="text-text-muted flex items-center gap-1.5 text-sm">
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
                  className="border-border text-text hover:bg-danger-light hover:text-danger rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  Archivar
                </button>
              )}
              <button
                onClick={() => forkMutation.mutate(ed.id)}
                disabled={forkMutation.isPending}
                className="bg-text text-on-dark hover:bg-ink-700 flex items-center gap-2 rounded-xl border-0 px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
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
          style={{ background: ed.color ?? "var(--color-course-teal-light)" }}
        >
          <span className="text-text/70 text-[11px] font-bold tracking-widest uppercase">
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
            className="font-display border-text/15 text-text w-full border-0 border-b-2 border-dashed bg-transparent pb-1.5 text-4xl font-bold"
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
            className="bg-surface/55 text-text resize-y rounded-md border-0 px-3 py-2.5 text-[15px] leading-relaxed"
          />
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="flex flex-col gap-1.5">
              <span className="text-text/70 text-[11px] font-semibold tracking-wider uppercase">
                Acceso
              </span>
              <div className="bg-surface/55 flex gap-0.5 rounded-md p-0.5">
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
                    ed.isFree ? "text-text bg-white" : "text-text-muted bg-transparent",
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
                    !ed.isFree ? "text-text bg-white" : "text-text-muted bg-transparent",
                  )}
                >
                  Pago
                </button>
              </div>
            </div>
            {!ed.isFree && (
              <label className="flex flex-col gap-1.5">
                <span className="text-text/70 text-[11px] font-semibold tracking-wider uppercase">
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
                  className="bg-surface/55 text-text w-32 rounded-md border-0 px-3 py-2 text-sm font-semibold"
                />
              </label>
            )}
            <div className="flex flex-col gap-1.5">
              <span className="text-text/70 text-[11px] font-semibold tracking-wider uppercase">
                Color
              </span>
              <div className="flex items-center gap-2">
                {[
                  "var(--color-course-teal-light)",
                  "var(--color-shop-amber-light)",
                  "var(--color-avatar-wine-light)",
                  "var(--color-avatar-blue-light)",
                  "var(--color-primary-light)",
                  "var(--color-avatar-teal-light)",
                  "var(--color-danger-light)",
                  "var(--color-fill-dark)",
                ].map((c) => (
                  <button
                    key={c}
                    onClick={() =>
                      canEdit &&
                      updateEd((d) => {
                        d.color = c;
                        return d;
                      })
                    }
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      background: c,
                      borderColor:
                        (ed.color ?? "var(--color-course-teal-light)") === c
                          ? "var(--color-text)"
                          : "transparent",
                    }}
                  />
                ))}
                {canEdit && (
                  <label
                    className="border-text/30 hover:border-text relative flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-2 border-dashed"
                    title="Color personalizado"
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
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    <input
                      type="color"
                      value={ed.color ?? "var(--color-course-teal-light)"}
                      onChange={(e) =>
                        updateEd((d) => {
                          d.color = e.target.value;
                          return d;
                        })
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* stats card */}
        <div className="bg-text text-on-dark flex flex-[1_1_180px] flex-col justify-between gap-2.5 self-stretch rounded-lg p-4.5">
          <span className="text-on-dark/55 text-[11px] font-bold tracking-widest uppercase">
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
              <span className="text-on-dark/65 text-xs">{label}</span>
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
                  ? "outline-text outline outline-2 outline-offset-[-2px]"
                  : "opacity-70",
              )}
            >
              <span className="text-text/70 text-[11px] font-bold tracking-wider uppercase">
                {t.title || `Unidad ${ti}`}
              </span>
              <span className="font-display text-text text-[17px] leading-tight font-bold">
                {t.subtitle || "Sin subtítulo"}
              </span>
              <span className="text-text/70 mt-1.5 text-xs">
                {t.lessons.length} {t.lessons.length === 1 ? "lección" : "lecciones"}
              </span>
            </button>
          ))}
          {canEdit && (
            <button
              onClick={addUnit}
              className="border-border-strong text-text-muted hover:border-text hover:text-text flex h-auto w-36 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-dashed bg-transparent text-sm font-semibold"
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
                <span className="text-text/70 text-[11px] font-bold tracking-wider uppercase">
                  Unidad
                </span>
                {canEdit && ed.topics.length > 1 && (
                  <button
                    onClick={deleteUnit}
                    className="bg-surface/60 text-text hover:bg-danger-light hover:text-danger flex items-center gap-1.5 rounded-md border-0 px-2 py-1 text-xs font-semibold"
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
                  className="bg-surface/60 text-text w-28 rounded-md border-0 px-2.5 py-2 text-sm font-semibold"
                />
                <input
                  readOnly={!canEdit}
                  value={topic.subtitle ?? ""}
                  onChange={(e) => setTopicField("subtitle", e.target.value)}
                  placeholder="Subtítulo"
                  className="font-display bg-surface/60 text-text min-w-0 flex-1 rounded-md border-0 px-2.5 py-2 text-base font-bold"
                />
              </div>
              <textarea
                readOnly={!canEdit}
                value={topic.description ?? ""}
                rows={2}
                onChange={(e) => setTopicField("description", e.target.value)}
                placeholder="Descripción de la unidad"
                className="bg-surface/60 text-text resize-y rounded-md border-0 px-2.5 py-2 text-sm leading-snug"
              />
            </div>

            <span className="text-text-muted mt-1.5 text-[11px] font-bold tracking-wider uppercase">
              Lecciones
            </span>
            {topic.lessons.map((l, li) => (
              <div
                key={l.id}
                onClick={() => setSelectedLessonIdx(li)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3.5 py-2.5",
                  li === selectedLessonIdx
                    ? "border-text bg-white"
                    : "border-border hover:bg-background bg-white",
                )}
              >
                <span className="text-text-muted font-mono text-xs">
                  {String(li + 1).padStart(2, "0")}
                </span>
                <span className="text-text flex-1 truncate text-sm font-semibold">{l.name}</span>
                <span
                  className={cn(
                    "text-xs font-semibold",
                    l.blocks.length === 0 ? "text-danger" : "text-text-muted",
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
                    className="text-text-muted hover:bg-danger-light hover:text-danger flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent"
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
                className="border-border-strong text-text-muted hover:border-text hover:text-text rounded-lg border border-dashed bg-transparent px-3 py-3 text-sm font-semibold"
              >
                + Lección
              </button>
            )}
          </div>
        )}

        {/* lesson + blocks editor */}
        {lesson && (
          <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-3">
            <div className="border-border flex flex-col gap-2 rounded-lg border bg-white p-4.5">
              <span className="text-text-muted text-[11px] font-bold tracking-wider uppercase">
                Lección {selectedLessonIdx + 1} · {lesson.blocks.length} blq
              </span>
              <input
                readOnly={!canEdit}
                value={lesson.name}
                onChange={(e) => setLessonField("name", e.target.value)}
                placeholder="Nombre de la lección"
                className="font-display border-border text-text border-0 border-b-2 border-dashed bg-transparent pb-1.5 text-2xl font-bold"
              />
              <input
                readOnly={!canEdit}
                value={lesson.description ?? ""}
                onChange={(e) => setLessonField("description", e.target.value)}
                placeholder="Descripción de la lección"
                className="text-text border-0 bg-transparent py-1 text-sm"
              />
            </div>

            {lesson.blocks.length === 0 && (
              <div className="border-border-strong text-text-muted rounded-lg border border-dashed px-7 py-7 text-center text-sm">
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
                      def?.bg ?? "bg-fill",
                      def?.wide ? "col-span-full" : "",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-text/60 font-mono text-xs">
                        {String(bi + 1).padStart(2, "0")}
                      </span>
                      <span className="text-text text-xs font-bold tracking-wide uppercase">
                        {def?.label ?? block.type}
                      </span>
                      <div className="ml-auto flex items-center gap-1">
                        {def?.xp && (
                          <label className="bg-surface/60 text-text/70 flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold">
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
                              className="text-text w-8 border-0 bg-transparent text-right text-xs font-bold"
                            />
                          </label>
                        )}
                        {canEdit && (
                          <>
                            <button
                              onClick={() => moveBlock(bi, -1)}
                              disabled={bi === 0}
                              className="text-text/60 hover:bg-surface/70 hover:text-text flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent disabled:opacity-30"
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
                              className="text-text/60 hover:bg-surface/70 hover:text-text flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent disabled:opacity-30"
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
                              className="text-text/60 hover:bg-danger-light hover:text-danger flex h-6 w-6 items-center justify-center rounded-md border-0 bg-transparent"
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
                  className="border-border-strong text-text-muted hover:border-text hover:text-text min-h-[120px] rounded-lg border border-dashed bg-transparent text-sm font-semibold"
                >
                  + Agregar bloque
                </button>
              )}
            </div>

            {adding && (
              <div className="border-border flex flex-col gap-3 rounded-lg border bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Elegí el tipo de bloque</span>
                  <button
                    onClick={() => setAdding(false)}
                    className="text-text-muted border-0 bg-transparent text-sm font-semibold"
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
                        "flex flex-col gap-1 rounded-md border-0 p-3 text-left hover:shadow-[0_0_0_2px_var(--color-text)]",
                        def.bg,
                      )}
                    >
                      <span className="text-text text-sm font-bold">{def.label}</span>
                      <span className="text-text/60 font-mono text-[10px]">{typeKey}</span>
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
          <div onClick={() => setDrawerOpen(false)} className="bg-ink-900/35 fixed inset-0 z-40" />
          <aside className="fixed top-0 right-0 bottom-0 z-50 flex w-[440px] max-w-full flex-col bg-white shadow-[-12px_0_40px_rgba(30,23,20,.15)]">
            <div className="border-border flex flex-col gap-3 border-b px-6 py-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-xl font-bold">Buscar seña</h3>
                  <p className="text-text-muted mt-0.5 text-sm">
                    {drawerTarget?.multi ? "Seleccioná una o más señas" : "Seleccioná una seña"}
                  </p>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="bg-fill text-text flex h-8 w-8 items-center justify-center rounded-lg border-0"
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
              <label className="border-border flex items-center gap-2 rounded-xl border bg-white px-3.5">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--color-text-muted)"
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
                  className="text-text flex-1 border-0 py-2.5 text-sm outline-none"
                />
              </label>
            </div>

            {pickedSign && (
              <div className="border-border flex flex-col gap-2.5 border-b px-6 py-4">
                {pickedSign.animationFormat === "mp4" ? (
                  <div className="flex gap-2">
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase">
                        Frontal
                      </span>
                      <div className="bg-ink-900 flex h-44 items-center justify-center overflow-hidden rounded-lg">
                        {signAnimationUrl ? (
                          <video
                            key={signAnimationUrl}
                            src={signAnimationUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            controls
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-surface/40 font-mono text-xs">Cargando…</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <span className="text-text-muted text-[10px] font-bold tracking-wider uppercase">
                        Lateral
                      </span>
                      <div className="bg-ink-900 flex h-44 items-center justify-center overflow-hidden rounded-lg">
                        {signLateralUrl ? (
                          <video
                            key={signLateralUrl}
                            src={signLateralUrl}
                            autoPlay
                            loop
                            muted
                            playsInline
                            controls
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-surface/40 font-mono text-xs">Sin lateral</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-44 overflow-hidden rounded-lg">
                    {signAnimationUrl ? (
                      <iframe
                        key={signAnimationUrl}
                        src={`/api/glb-viewer/file?src=${encodeURIComponent(signAnimationUrl)}`}
                        title={`Animación 3D de ${pickedSign.meaning}`}
                        className="h-full w-full border-0"
                      />
                    ) : (
                      <div className="bg-ink-900 flex h-full items-center justify-center">
                        <span className="text-surface/40 font-mono text-xs">Cargando…</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-[22px] font-bold">{pickedSign.meaning}</p>
                    <p className="text-text-muted text-xs">
                      {pickedSign.handedness === "ONE_HANDED" ? "Una mano" : "Dos manos"}
                    </p>
                  </div>
                  <button
                    onClick={usePicked}
                    className="bg-text text-on-dark hover:bg-ink-700 rounded-xl border-0 px-4 py-2.5 text-sm font-semibold whitespace-nowrap"
                  >
                    Usar en el bloque
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-3">
              {signQuery.length === 0 && (
                <p className="text-text-muted mx-2 mt-3 text-sm leading-relaxed">
                  Escribí el significado de la seña. Solo se pueden usar señas que ya tienen
                  animación.
                </p>
              )}
              {signQuery.length > 0 && signSearchQuery.isLoading && (
                <p className="text-text-muted mx-2 mt-3 text-sm">Buscando…</p>
              )}
              {signQuery.length > 0 &&
                !signSearchQuery.isLoading &&
                signSearchQuery.data?.content.filter((s) => s.hasAnimation).length === 0 && (
                  <div className="bg-danger-light mx-2 mt-2 rounded-lg px-4 py-3.5">
                    <p className="text-text text-sm font-bold">
                      No existe &ldquo;{signQuery}&rdquo; en R2
                    </p>
                    <p className="text-text mt-1 text-sm leading-snug">
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
                      pickedSign?.id === s.id ? "bg-primary-light" : "hover:bg-fill bg-transparent",
                    )}
                  >
                    <span className="bg-ink-900 flex h-10 w-10 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold text-white">
                      {s.animationFormat?.toUpperCase() ?? "GLB"}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-text text-[15px] font-semibold">{s.meaning}</span>
                      <span className="text-text-muted text-xs">
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
        <div className="bg-ink-900/50 fixed inset-0 z-60 flex items-center justify-center p-6">
          <div className="flex max-h-[calc(100vh-48px)] w-[540px] max-w-full flex-col gap-4.5 overflow-y-auto rounded-xl bg-white p-7 shadow-[0_24px_60px_rgba(30,23,20,.25)]">
            <div>
              <h3
                className="font-display text-2xl font-bold"
                style={{ textWrap: "balance" } as React.CSSProperties}
              >
                ¿Publicar {ed.name}?
              </h3>
              <p className="text-text-muted mt-1.5 text-sm leading-relaxed">
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
                  <p className="text-text/70 text-[11px] font-semibold tracking-wider uppercase">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 text-sm leading-snug">
              <div className="flex gap-2.5">
                <span className="text-text-muted w-28 shrink-0">Acceso</span>
                <span>{ed.isFree ? "Gratis" : `$${ed.price?.toLocaleString("es-AR") ?? "—"}`}</span>
              </div>
              <div className="flex gap-2.5">
                <span className="text-text-muted w-28 shrink-0">Al publicar</span>
                <span>La versión publicada actual pasará a Archivada.</span>
              </div>
            </div>

            {issues.length > 0 && (
              <div className="bg-danger-light flex flex-col gap-2 rounded-lg px-4 py-3.5">
                <span className="text-text text-sm font-bold">Resolvé esto antes de publicar</span>
                {issues.map((issue, i) => (
                  <div
                    key={i}
                    className="bg-surface/60 text-text flex justify-between gap-3 rounded-md px-2.5 py-2 text-sm"
                  >
                    {issue.text}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPublishOpen(false)}
                className="border-border text-text hover:bg-fill rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => publishMutation.mutate(ed.id)}
                disabled={issues.length > 0 || publishMutation.isPending}
                className="bg-text text-on-dark hover:bg-ink-700 rounded-xl border-0 px-5 py-2.5 text-sm font-semibold disabled:opacity-40"
              >
                {publishMutation.isPending ? "Publicando…" : "Sí, publicar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* confirm dialog */}
      {confirmDialog && (
        <div className="bg-ink-900/50 fixed inset-0 z-60 flex items-center justify-center p-6">
          <div className="flex w-[420px] max-w-full flex-col gap-4 rounded-xl bg-white p-6 shadow-[0_24px_60px_rgba(30,23,20,.25)]">
            <h3 className="font-display text-text text-xl font-bold">{confirmDialog.title}</h3>
            <p className="text-text-muted text-sm leading-relaxed">{confirmDialog.body}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="border-border text-text hover:bg-fill rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="bg-danger hover:bg-danger-dark rounded-xl border-0 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* toast */}
      {toast && (
        <div className="bg-text text-on-dark fixed right-6 bottom-6 z-70 max-w-[420px] rounded-xl px-4.5 py-3.5 text-sm font-medium shadow-[0_12px_32px_rgba(30,23,20,.25)]">
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
      ? { background: "var(--color-fill-light)" }
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
          ? "border-text translate-y-[-2px] shadow-[0_8px_28px_rgba(36,26,22,.14)]"
          : "border-border shadow-none",
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
          <span className="text-text font-mono text-xs font-semibold">v{item.version}</span>
          {item.basedOnVersion && (
            <span className="text-text/50 font-mono text-xs">
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
              "border-text/10 ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors",
              hovered ? "bg-text text-white" : "text-text bg-white",
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
        <h3 className="font-display text-text text-[26px] leading-[1.08] font-bold">
          {item.courseName}
        </h3>

        {/* hover CTA */}
        <div
          className="text-text flex items-center gap-1.5 text-sm font-semibold"
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
              <p className="font-display text-text text-xl font-bold">{val}</p>
              <p className="text-text-muted mt-0.5 text-[10px] font-semibold tracking-wide uppercase">
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* enrollment count */}
        {item.enrollmentCount > 0 && (
          <div className="bg-fill flex items-center gap-1.5 rounded-lg px-2.5 py-1.5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span className="text-text-muted text-xs font-semibold">
              {item.enrollmentCount} {item.enrollmentCount === 1 ? "alumno" : "alumnos"}
            </span>
          </div>
        )}

        {/* footer */}
        <div className="border-border mt-auto flex items-center justify-between gap-2 border-t pt-3">
          {/* left side */}
          {item.status === "DRAFT" && (
            <div className="flex min-w-0 items-center gap-2">
              {item.updatedByAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element -- a small photo served by the API; next/image cannot optimize it
                <img
                  src={item.updatedByAvatar}
                  alt=""
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="bg-primary-light text-primary-dark flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                  {initials || "?"}
                </span>
              )}
              {item.updatedByName && (
                <span className="bg-primary-light text-primary-dark shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold">
                  {item.updatedByName}
                </span>
              )}
              <span className="text-text-muted truncate text-xs">{formatAgo(item.updatedAt)}</span>
            </div>
          )}
          {item.status === "PUBLISHED" && (
            <div className="flex items-center gap-2">
              <span className="text-text-muted text-xs">
                Publicada el {formatDate(item.publishedAt)}
              </span>
              {onArchive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                  className="border-border text-text-muted hover:border-text hover:text-text rounded-md border bg-white px-2 py-1 text-xs font-semibold"
                >
                  Archivar
                </button>
              )}
            </div>
          )}
          {item.status === "ARCHIVED" && (
            <span className="text-text-muted text-xs">
              Publicada {formatDate(item.publishedAt)}
            </span>
          )}

          {/* price */}
          <span className="font-display text-text shrink-0 text-lg font-bold">
            {priceLabel(item)}
          </span>
        </div>
      </div>
    </article>
  );
}

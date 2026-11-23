"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Icon } from "@/components/dashboard/icons";
import { headerChip } from "@/components/dashboard/ui";
import { SignCard } from "@/features/admin/signs/sign-card";
import { SignEditor, signQueryKey } from "@/features/admin/signs/sign-editor";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { BLOCK_TYPES } from "@/lib/course-blocks";
import {
  countByFormat,
  filterSigns,
  newSignSchema,
  normalizeMeaning,
  type FormatFilter,
  type NewSignValues,
  type SignSort,
} from "@/lib/sign-editor";
import { cn } from "@/lib/utils";

/** The whole catalog is small (a few hundred signs): load it once and filter in the browser. */
const CATALOG_SIZE = 1000;

const FORMAT_TABS: { key: FormatFilter; label: string }[] = [
  { key: "all", label: "Todas" },
  { key: "glb", label: "3D (.glb)" },
  { key: "mp4", label: "Video (.mp4)" },
  { key: "none", label: "Sin archivo" },
];

const SORTS: { key: SignSort; label: string }[] = [
  { key: "az", label: "A → Z" },
  { key: "recent", label: "Subidas recientes" },
  { key: "used", label: "Más usadas" },
];

function DropdownPicker<T extends string>({
  icon,
  options,
  value,
  onChange,
  ariaLabel,
}: {
  icon: Parameters<typeof Icon>[0]["name"];
  options: { key: T; label: string }[];
  value: T | null;
  onChange: (key: T | null) => void;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const current = options.find((o) => o.key === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          headerChip,
          "border-border bg-surface text-text cursor-pointer border transition-shadow hover:shadow-sm",
        )}
      >
        <Icon name={icon} className="size-4" />
        <span className="max-w-[200px] truncate">{current?.label ?? options[0]?.label}</span>
        <Icon
          name="chevronDown"
          className={cn("size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open ? (
        <ul
          id={menuId}
          role="listbox"
          aria-label={ariaLabel}
          className="border-border bg-surface absolute left-0 z-30 mt-2 flex w-56 flex-col gap-0.5 rounded-2xl border p-1.5 shadow-lg"
        >
          {options.map((o) => {
            const selected = value === o.key;
            return (
              <li key={o.key} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.key);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors",
                    selected ? "bg-primary-light text-primary-dark" : "hover:bg-fill text-text",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {selected ? <Icon name="check" className="size-4" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

export default function SignsPage() {
  return (
    <Suspense fallback={<p className="text-text-muted">Cargando…</p>}>
      <SignsScreen />
    </Suspense>
  );
}

function SignsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = useSearchParams().get("id");
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const open = (id: string) => router.push(`${pathname}?id=${id}`);
  const close = () => router.push(pathname);

  return (
    <>
      {selectedId ? (
        <SignEditor id={selectedId} onBack={close} onToast={showToast} />
      ) : (
        <Catalog onOpen={open} onToast={showToast} />
      )}
      {toast && (
        <div
          role="status"
          className="bg-text text-on-dark fixed right-6 bottom-6 z-70 max-w-[420px] rounded-xl px-4.5 py-3.5 text-sm font-medium shadow-[0_12px_32px_rgba(30,23,20,.25)]"
        >
          {toast}
        </div>
      )}
    </>
  );
}

function Catalog({
  onOpen,
  onToast,
}: {
  onOpen: (id: string) => void;
  onToast: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [format, setFormat] = useState<FormatFilter>("all");
  const [sort, setSort] = useState<SignSort>("az");
  const [creating, setCreating] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "signs", "catalog"],
    queryFn: () => adminApi.signs({ size: CATALOG_SIZE }),
  });

  const { data: coursesData } = useQuery({
    queryKey: ["admin", "courses"],
    queryFn: () => adminApi.courses(),
    staleTime: 5 * 60_000,
  });
  const courses = coursesData ?? [];

  const selectedCourse = courses.find((c) => c.id === selectedCourseId) ?? null;
  const bestVersionId = useMemo(() => {
    if (!selectedCourse) return null;
    const published = selectedCourse.versions.find((v) => v.status === "PUBLISHED");
    if (published) return published.id;
    const nonArchived = selectedCourse.versions
      .filter((v) => v.status !== "ARCHIVED")
      .sort((a, b) => b.version - a.version);
    return nonArchived[0]?.id ?? null;
  }, [selectedCourse]);

  const { data: courseVersionDetail } = useQuery({
    queryKey: ["admin", "course-version", bestVersionId],
    queryFn: () => adminApi.courseVersion(bestVersionId!),
    enabled: !!bestVersionId,
    staleTime: 5 * 60_000,
  });

  const courseSignMeanings = useMemo<Set<string> | null>(() => {
    if (!selectedCourseId) return null;
    if (!courseVersionDetail) return null;
    const meanings = new Set<string>();
    for (const topic of courseVersionDetail.topics) {
      for (const lesson of topic.lessons) {
        for (const block of lesson.blocks) {
          const def = BLOCK_TYPES[block.type];
          if (!def) continue;
          for (const [key, fieldType] of def.fields) {
            if (fieldType === "sign") {
              const v = block.config[key];
              if (typeof v === "string" && v.trim()) meanings.add(v.trim());
            } else if (fieldType === "signs") {
              const arr = block.config[key];
              if (Array.isArray(arr)) {
                for (const v of arr) {
                  if (typeof v === "string" && v.trim()) meanings.add(v.trim());
                }
              }
            }
          }
        }
      }
    }
    return meanings;
  }, [selectedCourseId, courseVersionDetail]);

  const all = data?.content ?? [];
  const inCourse = useMemo(() => {
    if (!selectedCourseId) return all;
    if (!courseSignMeanings) return [];
    return all.filter((s) => courseSignMeanings.has(s.meaning));
  }, [all, selectedCourseId, courseSignMeanings]);
  const counts = countByFormat(inCourse);
  const visible = filterSigns(inCourse, { query, format, sort });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-text mb-2 text-2xl font-bold">Señas</h1>
          <p className="text-text-muted max-w-xl text-sm">
            El catálogo de señas que usan los cursos. Cambiá el nombre, las manos o el video de
            YouTube, y subí la animación en 3D (.glb) o en video (.mp4): la app la muestra al
            instante.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="bg-text text-on-dark hover:bg-ink-700 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            aria-hidden
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva seña
        </button>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <label className="border-border flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border bg-white px-3.5 sm:max-w-sm">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="text-text-muted"
            aria-hidden
          >
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre…"
            aria-label="Buscar seña"
            className="text-text flex-1 py-2.5 text-sm outline-none"
          />
        </label>
        <div className="bg-fill flex w-fit flex-wrap gap-1 rounded-xl p-1" role="tablist">
          {FORMAT_TABS.map(({ key, label }) => (
            <button
              key={key}
              role="tab"
              aria-selected={format === key}
              onClick={() => setFormat(key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
                format === key ? "text-text bg-white shadow-sm" : "text-text-muted hover:text-text",
              )}
            >
              {label}
              {data && <span className="text-text-muted text-xs font-bold">{counts[key]}</span>}
            </button>
          ))}
        </div>
        {courses.length > 0 && (
          <DropdownPicker
            icon="book"
            ariaLabel="Curso"
            options={[
              { key: "" as string, label: "Todos los cursos" },
              ...courses.map((c) => ({ key: c.id, label: c.name })),
            ]}
            value={selectedCourseId ?? ""}
            onChange={(v) => {
              setSelectedCourseId(v || null);
              setFormat("all");
            }}
          />
        )}
        <DropdownPicker
          icon="sortable"
          ariaLabel="Orden"
          options={SORTS}
          value={sort}
          onChange={(v) => v && setSort(v)}
        />
      </div>

      {isPending ? (
        <div
          className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4"
          aria-label="Cargando…"
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-fill h-52 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <p className="text-danger">No pudimos cargar los datos.</p>
      ) : visible.length === 0 ? (
        <div className="border-fill-dark text-text-muted rounded-lg border border-dashed px-5 py-10 text-center text-sm">
          {all.length === 0
            ? "Todavía no hay señas. Creá la primera."
            : selectedCourseId && inCourse.length === 0
              ? "El curso no tiene señas en el catálogo."
              : "Ninguna seña coincide con la búsqueda."}
        </div>
      ) : (
        <>
          <p className="text-text-muted mb-4 text-sm">
            {visible.length} de {selectedCourseId ? inCourse.length : all.length} señas
            {selectedCourseId && inCourse.length < all.length && (
              <span> · {all.length} en total</span>
            )}
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {visible.map((s) => (
              <SignCard key={s.id} sign={s} onOpen={() => onOpen(s.id)} />
            ))}
          </div>
        </>
      )}

      {creating && (
        <CreateSignDialog
          initialMeaning={query}
          onClose={() => setCreating(false)}
          onCreated={(id, meaning) => {
            setCreating(false);
            onToast(`Seña “${meaning}” creada. Ahora subile la animación.`);
            onOpen(id);
          }}
        />
      )}
    </div>
  );
}

function CreateSignDialog({
  initialMeaning,
  onClose,
  onCreated,
}: {
  initialMeaning: string;
  onClose: () => void;
  onCreated: (id: string, meaning: string) => void;
}) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<NewSignValues>({
    resolver: zodResolver(newSignSchema),
    defaultValues: { meaning: initialMeaning.trim(), handedness: "ONE_HANDED" },
  });
  const handedness = useWatch({ control, name: "handedness" });

  const create = useMutation({
    mutationFn: (values: NewSignValues) =>
      adminApi.createSign({
        meaning: normalizeMeaning(values.meaning),
        handedness: values.handedness,
      }),
    onSuccess: (sign) => {
      queryClient.setQueryData(signQueryKey(sign.id), sign);
      void queryClient.invalidateQueries({ queryKey: ["admin", "signs"] });
      onCreated(sign.id, sign.meaning);
    },
  });

  const apiProblem =
    create.error instanceof ApiError && create.error.status === 409
      ? "Ya existe una seña con ese nombre."
      : create.error
        ? "No pudimos crear la seña. Intentá de nuevo."
        : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-sign-title"
      className="bg-ink-900/50 fixed inset-0 z-60 flex items-center justify-center p-6"
    >
      <form
        onSubmit={handleSubmit((values) => create.mutate(values))}
        className="flex w-[440px] max-w-full flex-col gap-4 rounded-xl bg-white p-6 shadow-[0_24px_60px_rgba(30,23,20,.25)]"
      >
        <h3 id="new-sign-title" className="font-display text-text text-xl font-bold">
          Nueva seña
        </h3>
        <label className="flex flex-col gap-1.5">
          <span className="text-text-muted text-xs font-semibold tracking-wider uppercase">
            Nombre
          </span>
          <input
            autoFocus
            {...register("meaning")}
            placeholder="Por ejemplo: buen día"
            aria-invalid={!!errors.meaning}
            className="border-border focus:border-text text-text rounded-xl border px-3.5 py-2.5 text-sm outline-none"
          />
          {errors.meaning && <span className="text-danger text-sm">{errors.meaning.message}</span>}
        </label>
        <div className="flex flex-col gap-1.5">
          <span className="text-text-muted text-xs font-semibold tracking-wider uppercase">
            Manos
          </span>
          <div className="bg-fill flex w-fit gap-1 rounded-xl p-1" role="radiogroup">
            {(
              [
                ["ONE_HANDED", "Una mano"],
                ["TWO_HANDED", "Dos manos"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={handedness === value}
                onClick={() => setValue("handedness", value)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-semibold",
                  handedness === value ? "text-text bg-white shadow-sm" : "text-text-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {apiProblem && (
          <p role="alert" className="bg-danger-light text-danger rounded-lg px-4 py-2.5 text-sm">
            {apiProblem}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border-border text-text hover:bg-fill rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={create.isPending}
            className="bg-text text-on-dark hover:bg-ink-700 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            {create.isPending ? "Creando…" : "Crear seña"}
          </button>
        </div>
      </form>
    </div>
  );
}

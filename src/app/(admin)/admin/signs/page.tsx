"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Suspense, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { SignCard } from "@/features/admin/signs/sign-card";
import { SignEditor, signQueryKey } from "@/features/admin/signs/sign-editor";
import { adminApi } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
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
  { key: "none", label: "Sin animación" },
];

const SORTS: { key: SignSort; label: string }[] = [
  { key: "az", label: "A → Z" },
  { key: "recent", label: "Subidas recientes" },
  { key: "used", label: "Más usadas" },
];

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

  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "signs", "catalog"],
    queryFn: () => adminApi.signs({ size: CATALOG_SIZE }),
  });

  const all = data?.content ?? [];
  const counts = countByFormat(all);
  const visible = filterSigns(all, { query, format, sort });

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
        <label className="border-border text-text flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2 text-sm font-semibold">
          <span className="text-text-muted font-normal">Orden</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SignSort)}
            className="bg-transparent outline-none"
          >
            {SORTS.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
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
            : "Ninguna seña coincide con la búsqueda."}
        </div>
      ) : (
        <>
          <p className="text-text-muted mb-4 text-sm">
            {visible.length} de {all.length} señas
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

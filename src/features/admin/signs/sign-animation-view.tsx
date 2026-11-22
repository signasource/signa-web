import { SignMediaPreview } from "@/features/admin/signs/sign-media-preview";
import type { AdminSignDetail } from "@/lib/api/admin";
import { formatAgo } from "@/lib/sign-editor";

const FORMAT_LABEL = { glb: "Avatar 3D (.glb)", mp4: "Video (.mp4)" } as const;

/**
 * The editor's "Animación" section, read-only: the preview of what learners see in the app and
 * which file it is. The files are not replaced from the panel (that option was removed), so there
 * is nothing to upload here.
 */
export function SignAnimationView({
  sign,
  meaning,
}: {
  sign: AdminSignDetail;
  /** The name as typed (unsaved), for the preview caption. */
  meaning: string;
}) {
  const missing = sign.hasAnimation && sign.mediaAvailable === false;

  return (
    <section className="border-border flex w-full flex-wrap gap-8 rounded-lg border bg-white p-6">
      <SignMediaPreview
        meaning={meaning}
        format={sign.animationFormat}
        url={sign.mediaUrl}
        lateralUrl={sign.lateralMediaUrl}
        missing={missing}
      />
      <div className="flex min-w-[280px] flex-1 flex-col gap-4">
        <div>
          <h2 className="font-display text-text text-xl font-bold">Animación</h2>
          <p className="text-text-muted mt-1 text-sm leading-relaxed">
            Lo que ve el alumno en la app, en todas las lecciones que usan la seña.
          </p>
        </div>

        {missing ? (
          <p role="alert" className="bg-danger-light text-danger rounded-lg px-4 py-3 text-sm">
            <b>Falta el archivo.</b> La seña apunta a{" "}
            <span className="font-mono text-xs">{sign.animationUrl}</span>, pero no existe en el
            bucket, así que la app no muestra nada.
          </p>
        ) : null}

        {sign.hasAnimation && sign.animationFormat ? (
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="text-text-muted text-[11px] font-semibold tracking-wider uppercase">
                Formato
              </dt>
              <dd className="text-text font-semibold">{FORMAT_LABEL[sign.animationFormat]}</dd>
            </div>
            <FileRow
              label={sign.animationFormat === "mp4" ? "Video de frente" : "Archivo"}
              path={sign.animationUrl}
              url={missing ? null : sign.mediaUrl}
            />
            {sign.animationFormat === "mp4" ? (
              <FileRow
                label="Video lateral"
                path={sign.lateralAnimationUrl}
                url={sign.lateralMediaUrl}
              />
            ) : null}
          </dl>
        ) : (
          <p className="text-text-muted text-sm">Todavía no tiene animación.</p>
        )}

        {sign.hasAnimation ? (
          <p className="text-text-muted text-xs">
            {sign.animationUpdatedAt
              ? `Última subida ${formatAgo(sign.animationUpdatedAt)} · ${new Date(sign.animationUpdatedAt).toLocaleString("es-AR")}`
              : "Archivo original del catálogo."}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function FileRow({ label, path, url }: { label: string; path: string | null; url: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-text-muted text-[11px] font-semibold tracking-wider uppercase">
        {label}
      </dt>
      <dd className="text-text font-mono text-xs break-all">
        {path ?? <span className="text-text-muted font-sans">No tiene.</span>}
        {path && url ? (
          <>
            {" · "}
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted font-sans underline underline-offset-2"
            >
              descargar
            </a>
          </>
        ) : null}
      </dd>
    </div>
  );
}

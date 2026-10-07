const IN_APP: ReadonlyArray<readonly [name: string, ua: RegExp]> = [
  ["Instagram", /Instagram/i],
  ["Facebook", /FBAN|FBAV|FB_IAB|FBIOS/i],
  ["Messenger", /Messenger/i],
  ["TikTok", /musical_ly|BytedanceWebview|TikTok/i],
  ["LinkedIn", /LinkedInApp/i],
  ["X", /Twitter/i],
  ["Snapchat", /Snapchat/i],
  ["Line", /\bLine\//],
];

export function inAppBrowser(ua: string): string | null {
  return IN_APP.find(([, re]) => re.test(ua))?.[0] ?? null;
}

const openOutside = (app: string) =>
  `Estás en el navegador de ${app}, que no deja usar bien la cámara. Abrí esta página en Chrome o Safari (en el menú ··· de ${app}, «Abrir en el navegador»).`;

const NETWORK = /fetch|network|load failed|HTTP 5\d\d|timed? ?out/i;

export function cameraMessage(error: unknown, ua: string): string {
  const name = error instanceof DOMException ? error.name : "";
  const app = inAppBrowser(ua);
  if (name === "NotAllowedError" || name === "SecurityError")
    return app
      ? openOutside(app)
      : "Necesitamos permiso para usar la cámara. Habilitalo en tu navegador y volvé a intentar.";
  if (name === "NotFoundError" || name === "OverconstrainedError")
    return "No encontramos ninguna cámara en este dispositivo.";
  if (name === "NotReadableError" || name === "AbortError")
    return "La cámara la está usando otra app o pestaña. Cerrala y volvé a intentar.";
  return app ? openOutside(app) : "No pudimos abrir la cámara en este navegador.";
}

export function engineMessage(error: unknown, ua: string, online: boolean): string {
  const text = error instanceof Error ? error.message : String(error);
  if (!online || NETWORK.test(text))
    return "No pudimos descargar el reconocedor. Revisá tu conexión a internet y volvé a intentar.";
  const app = inAppBrowser(ua);
  if (app) return openOutside(app);
  if (typeof WebAssembly === "undefined" || typeof Worker === "undefined")
    return "Este navegador es muy viejo para el reconocimiento. Probá con Chrome, Edge, Firefox o Safari actualizados.";
  return "No pudimos iniciar el reconocimiento en este navegador. Probá con Chrome, Edge, Firefox o Safari actualizados.";
}

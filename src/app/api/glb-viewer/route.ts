import { buildViewerCsp } from "@/lib/security/csp";

const R2_BASE = "https://pub-f40a1de4d1fc46b0b6f07299847c66e0.r2.dev/lsa";
const MODEL_VIEWER_CDN =
  "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";

const FOV = 15;
const ENCUADRE = 0.52;

// Only allow alphanumeric, hyphens, underscores, and spaces (URL-encoded) in sign names.
const SAFE_SIGN_RE = /^[\w\- ]+$/;

function buildViewerHtml(glbUrl: string): string {
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>html,body{margin:0;height:100%;background:transparent;overflow:hidden}model-viewer{display:block;width:100%;height:100%;--background-color:transparent}</style>
  <script type="module" src="${MODEL_VIEWER_CDN}"></script>
</head>
<body>
  <model-viewer id="mv" loading="eager"
    disable-pan interaction-prompt="none"
    shadow-intensity="0" exposure="1"></model-viewer>
  <script>
    var FOV=${FOV},ENCUADRE=${ENCUADRE},mv=document.getElementById('mv');
    customElements.whenDefined('model-viewer').then(function(){
      mv.addEventListener('load',function(){
        try{
          var d=mv.getDimensions(),c=mv.getBoundingBoxCenter();
          mv.cameraTarget='0m '+(c.y+d.y*.3).toFixed(3)+'m 0m';
          mv.fieldOfView=FOV+'deg';
          var r=(d.y*ENCUADRE/2)/Math.tan(FOV/2*Math.PI/180);
          mv.cameraOrbit='0deg 85deg '+r.toFixed(3)+'m';
          mv.jumpCameraToGoal();
        }catch(_){}
      });
      mv.setAttribute('autoplay','');
      mv.setAttribute('camera-orbit','0deg 85deg 100%');
      mv.setAttribute('field-of-view',FOV+'deg');
      mv.setAttribute('src',${JSON.stringify(glbUrl)});
    });
  </script>
</body>
</html>`;
}

export function GET(request: Request): Response {
  const { searchParams } = new URL(request.url);
  const sign = searchParams.get("sign") ?? "";

  if (!SAFE_SIGN_RE.test(sign)) {
    return new Response("Bad Request", { status: 400 });
  }

  const glbUrl = `${R2_BASE}/${encodeURIComponent(sign)}.glb`;
  const html = buildViewerHtml(glbUrl);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": buildViewerCsp(),
      // Allow same-origin pages to embed this route in an iframe.
      // Overrides the global X-Frame-Options: DENY set in next.config.ts.
      "X-Frame-Options": "SAMEORIGIN",
      "Cache-Control": "public, max-age=86400",
    },
  });
}

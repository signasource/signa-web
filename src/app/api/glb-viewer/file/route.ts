import { env } from "@/lib/env";
import {
  DRACO,
  ENCUADRE,
  FOV,
  isAllowedGlbSource,
  MODEL_VIEWER_CDN,
  MODEL_VIEWER_SRI,
} from "@/lib/glb";
import { buildViewerCsp } from "@/lib/security/csp";

/**
 * Single-model GLB viewer by URL, for the admin sign editor's preview of an uploaded animation (the
 * landing viewer at /api/glb-viewer only knows the bucket's default `<meaning>.glb`). The source is
 * restricted by `isAllowedGlbSource`, and is embedded with JSON.stringify, never raw.
 */
function buildHtml(src: string): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="icon" href="data:,">
  <link rel="preload" href="${DRACO}draco_wasm_wrapper.js" as="fetch" crossorigin="anonymous">
  <link rel="preload" href="${DRACO}draco_decoder.wasm" as="fetch" crossorigin="anonymous">
  <style>
    html,body{margin:0;height:100%;background:transparent;overflow:hidden}
    model-viewer{position:absolute;inset:0;width:100%;height:100%;--background-color:transparent;--poster-color:transparent;cursor:grab;opacity:0;transition:opacity .3s ease}
    model-viewer.on{opacity:1}
    #spin{position:absolute;left:50%;top:50%;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;border:3px solid rgba(120,87,255,.2);border-top-color:#7857ff;animation:s .8s linear infinite}
    body.ready #spin,body.failed #spin{display:none}
    #err{display:none;position:absolute;inset:0;align-items:center;justify-content:center;font:700 12px system-ui,sans-serif;color:#8c817a;text-align:center;padding:16px}
    body.failed #err{display:flex}
    @keyframes s{to{transform:rotate(360deg)}}
  </style>
  <script type="module" src="${MODEL_VIEWER_CDN}" integrity="${MODEL_VIEWER_SRI}" crossorigin="anonymous"></script>
</head>
<body>
  <div id="spin" aria-hidden="true"></div>
  <div id="err">No pudimos cargar el modelo 3D.</div>
  <model-viewer id="mv" autoplay camera-controls disable-zoom disable-pan interaction-prompt="none"
    shadow-intensity="0" exposure="1" field-of-view="${FOV}deg" camera-orbit="0deg 85deg 100%"
    alt="Avatar haciendo la seña en 3D. Arrastrá para girarlo."></model-viewer>
  <script>
    var FOV=${FOV},ENCUADRE=${ENCUADRE},mv=document.getElementById('mv'),b=document.body;
    mv.addEventListener('load',function(){
      try{
        var d=mv.getDimensions(),c=mv.getBoundingBoxCenter();
        var r=(d.y*ENCUADRE/2)/Math.tan(FOV/2*Math.PI/180);
        mv.cameraTarget='0m '+(c.y+d.y*.3).toFixed(3)+'m 0m';
        mv.cameraOrbit='0deg 85deg '+r.toFixed(3)+'m';
        mv.minCameraOrbit='auto 60deg '+r.toFixed(3)+'m';
        mv.maxCameraOrbit='auto 100deg '+r.toFixed(3)+'m';
        mv.jumpCameraToGoal();
      }catch(_){}
      mv.play();
      requestAnimationFrame(function(){mv.classList.add('on');b.classList.add('ready');});
    });
    mv.addEventListener('error',function(){b.classList.add('failed');});
    mv.src=${JSON.stringify(src)};
  </script>
</body>
</html>`;
}

export function GET(request: Request): Response {
  const src = new URL(request.url).searchParams.get("src") ?? "";

  if (!isAllowedGlbSource(src, env.apiUrl)) {
    return new Response("Bad Request", { status: 400 });
  }

  return new Response(buildHtml(src).replace(/\n\s*/g, ""), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": buildViewerCsp(),
      "X-Frame-Options": "SAMEORIGIN",
      "Cache-Control": "no-store",
    },
  });
}

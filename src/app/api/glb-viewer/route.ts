import { buildViewerCsp } from "@/lib/security/csp";
import { isSafeSign, R2_GLB_BASE, VIEWER_MESSAGE } from "@/lib/glb";

const MODEL_VIEWER_CDN =
  "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";

const FOV = 15;
const ENCUADRE = 0.52;

/**
 * model-viewer page embedded by `LisaGlbViewer`. Shows Lisa's static picture as a poster until the
 * GLB is decoded (so the phone mockup is never empty), lets the visitor drag to rotate, and swaps
 * the sign in place when the parent page posts `{ type: VIEWER_MESSAGE, sign }` — no reload, the
 * model-viewer bundle and the Draco decoder stay warm.
 */
function buildViewerHtml(sign: string): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>
    html,body{margin:0;height:100%;background:transparent;overflow:hidden}
    model-viewer{display:block;width:100%;height:100%;--background-color:transparent;--poster-color:transparent;cursor:grab}
    model-viewer:active{cursor:grabbing}
    #poster{position:absolute;left:50%;top:14px;height:118%;transform:translateX(-50%);pointer-events:none;transition:opacity .35s ease}
    #spin{position:absolute;right:12px;bottom:12px;width:22px;height:22px;border-radius:50%;border:3px solid rgba(120,87,255,.25);border-top-color:#7857ff;/* --color-primary; this page lives outside Tailwind */animation:s .8s linear infinite;transition:opacity .2s}
    body.ready #poster,body.ready #spin{opacity:0}
    body.failed #spin{opacity:0}
    @keyframes s{to{transform:rotate(360deg)}}
  </style>
  <script type="module" src="${MODEL_VIEWER_CDN}"></script>
</head>
<body>
  <img id="poster" src="/images/lisa-arms-crossed.png" alt="">
  <model-viewer id="mv" loading="eager" camera-controls disable-zoom disable-pan
    touch-action="pan-y" interaction-prompt="none" shadow-intensity="0" exposure="1"
    alt="Lisa haciendo la seña en 3D. Arrastrá para girarla."></model-viewer>
  <div id="spin" aria-hidden="true"></div>
  <script>
    var FOV=${FOV},ENCUADRE=${ENCUADRE},BASE=${JSON.stringify(R2_GLB_BASE)},
        SAFE=${String(/^[\p{L}\p{N}_\- ]{1,40}$/u)},mv=document.getElementById('mv'),b=document.body;
    var cur=${JSON.stringify(sign)};
    function show(sign){
      var url=BASE+'/'+encodeURIComponent(sign)+'.glb';
      if(mv.getAttribute('src')===url)return;
      b.classList.remove('ready','failed');
      mv.setAttribute('src',url);
    }
    customElements.whenDefined('model-viewer').then(function(){
      mv.addEventListener('load',function(){
        try{
          var d=mv.getDimensions(),c=mv.getBoundingBoxCenter();
          mv.cameraTarget='0m '+(c.y+d.y*.3).toFixed(3)+'m 0m';
          mv.fieldOfView=FOV+'deg';
          var r=(d.y*ENCUADRE/2)/Math.tan(FOV/2*Math.PI/180);
          mv.cameraOrbit='0deg 85deg '+r.toFixed(3)+'m';
          mv.minCameraOrbit='auto 60deg '+r.toFixed(3)+'m';
          mv.maxCameraOrbit='auto 100deg '+r.toFixed(3)+'m';
          mv.jumpCameraToGoal();
        }catch(_){}
        mv.play();
        b.classList.add('ready');
      });
      mv.addEventListener('error',function(){b.classList.add('failed');});
      mv.setAttribute('autoplay','');
      mv.setAttribute('camera-orbit','0deg 85deg 100%');
      mv.setAttribute('field-of-view',FOV+'deg');
      show(cur);
    });
    addEventListener('message',function(e){
      if(e.origin!==location.origin||!e.data||e.data.type!==${JSON.stringify(VIEWER_MESSAGE)})return;
      if(typeof e.data.sign!=='string'||!SAFE.test(e.data.sign))return;
      cur=e.data.sign;
      if(customElements.get('model-viewer'))show(cur);
    });
  </script>
</body>
</html>`;
}

export function GET(request: Request): Response {
  const { searchParams } = new URL(request.url);
  const sign = searchParams.get("sign") ?? "";

  if (!isSafeSign(sign)) {
    return new Response("Bad Request", { status: 400 });
  }

  return new Response(buildViewerHtml(sign), {
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

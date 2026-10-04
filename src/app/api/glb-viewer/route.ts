import { buildViewerCsp } from "@/lib/security/csp";
import { isSafeSign, MAX_PRELOAD, R2_GLB_BASE, VIEWER_MESSAGE, VIEWER_PRELOAD } from "@/lib/glb";

const MODEL_VIEWER_CDN =
  "https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js";
const MODEL_VIEWER_SRI = "sha384-Ftcjj/GNLxPvzNDftO/oryXB9aGxsGZY9JGqsXG0uUKgQDl9RfDgsx9NJ/4IVNPe";

const FOV = 15;
const ENCUADRE = 0.52;

function buildViewerHtml(sign: string): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="icon" href="data:,">
  <style>
    html,body{margin:0;height:100%;background:transparent;overflow:hidden}
    model-viewer{position:absolute;inset:0;display:block;width:100%;height:100%;--background-color:transparent;--poster-color:transparent;cursor:grab;opacity:0;pointer-events:none;transition:opacity .3s ease}
    model-viewer:active{cursor:grabbing}
    model-viewer.on{opacity:1;pointer-events:auto}
    #spin{position:absolute;left:50%;top:50%;width:28px;height:28px;margin:-14px 0 0 -14px;border-radius:50%;border:3px solid rgba(120,87,255,.2);border-top-color:#7857ff;animation:s .8s linear infinite;transition:opacity .2s;pointer-events:none}
    body.ready #spin,body.failed #spin{opacity:0}
    #err{display:none;position:absolute;inset:0;align-items:center;justify-content:center;font:700 12px system-ui,sans-serif;color:#8c817a}
    body.failed #err{display:flex}
    @keyframes s{to{transform:rotate(360deg)}}
  </style>
  <script type="module" src="${MODEL_VIEWER_CDN}" integrity="${MODEL_VIEWER_SRI}" crossorigin="anonymous"></script>
</head>
<body>
  <div id="spin" aria-hidden="true"></div>
  <div id="err">No pudimos cargar la seña.</div>
  <script>
    var WARM_SPEED=4,FOV=${FOV},ENCUADRE=${ENCUADRE},BASE=${JSON.stringify(R2_GLB_BASE)},MAX=${MAX_PRELOAD},
        SAFE=${String(/^[\p{L}\p{N}_\- ]{1,40}$/u)},b=document.body;
    var cache={},order=[],queue=[],loading=0,shown=null,holding=null,slot=null,warm=null,warming=false,warmed=false,want=${JSON.stringify(sign)};
    function urlOf(sign){return BASE+'/'+encodeURIComponent(sign)+'.glb';}
    function frame(mv){
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
    }
    function viewer(sign){
      if(cache[sign])return cache[sign];
      if(order.length>=MAX){var old=order.shift();if(cache[old]!==shown){cache[old].remove();delete cache[old];}}
      var mv=document.createElement('model-viewer');
      mv.setAttribute('loading','eager');
      mv.setAttribute('camera-controls','');
      mv.setAttribute('disable-zoom','');
      mv.setAttribute('disable-pan','');
      mv.setAttribute('touch-action','pan-y');
      mv.setAttribute('interaction-prompt','none');
      mv.setAttribute('shadow-intensity','0');
      mv.setAttribute('exposure','1');
      mv.setAttribute('camera-orbit','0deg 85deg 100%');
      mv.setAttribute('field-of-view',FOV+'deg');
      mv.setAttribute('alt','Lisa haciendo la seña en 3D. Arrastrá para girarla.');
      loading++;
      mv.addEventListener('load',function(){
        frame(mv);
        mv.pause();
        mv.dataset.loaded='1';
        loading--;
        if(want===sign)reveal(sign);
        resume();
      });
      mv.addEventListener('error',function(){
        mv.dataset.failed='1';
        loading--;
        if(want===sign){b.classList.remove('ready');b.classList.add('failed');}
        resume();
      });
      mv.setAttribute('src',urlOf(sign));
      b.appendChild(mv);
      cache[sign]=mv;order.push(sign);
      return mv;
    }
    function reveal(sign){
      var mv=cache[sign];
      if(shown&&shown!==mv){shown.classList.remove('on');shown.pause();}
      shown=mv;
      holding=null;
      mv.currentTime=0;
      mv.play();
      clearTimeout(slot);
      clearTimeout(warm);
      warming=false;
      mv.timeScale=1;
      if(!warmed){
        warmed=true;
        warming=true;
        mv.timeScale=WARM_SPEED;
        warm=setTimeout(function(){
          warming=false;
          mv.timeScale=1;
          if(shown!==mv)return;
          mv.currentTime=0;
          uncover(mv,sign);
        },(mv.duration||0)*1000/WARM_SPEED);
        return;
      }
      uncover(mv,sign);
    }
    function uncover(mv,sign){
      arm();
      requestAnimationFrame(function(){requestAnimationFrame(function(){
        if(want!==sign)return;
        mv.classList.add('on');
        b.classList.add('ready');
      });});
    }
    function arm(){
      clearTimeout(slot);
      if(warming)return;
      while(queue.length&&cache[queue[0]])queue.shift();
      if(!shown||!queue.length)return;
      var d=shown.duration||0;
      var left=d?d-(shown.currentTime%d):1;
      slot=setTimeout(boundary,Math.max(0,left*1000-40));
    }
    function boundary(){
      if(loading||!shown)return arm();
      while(queue.length&&cache[queue[0]])queue.shift();
      if(!queue.length)return;
      holding=shown;
      shown.pause();
      shown.currentTime=0;
      viewer(queue.shift());
    }
    function resume(){
      var h=holding;
      holding=null;
      if(h&&h===shown)h.play();
      arm();
    }
    function show(sign){
      want=sign;
      var mv=viewer(sign);
      b.classList.remove('failed');
      if(mv.dataset.loaded)return reveal(sign);
      b.classList.remove('ready');
      if(shown){shown.classList.remove('on');shown.pause();shown=null;}
      if(mv.dataset.failed)b.classList.add('failed');
    }
    customElements.whenDefined('model-viewer').then(function(){show(want);});
    addEventListener('message',function(e){
      if(e.origin!==location.origin||!e.data)return;
      if(e.data.type===${JSON.stringify(VIEWER_MESSAGE)}){
        if(typeof e.data.sign!=='string'||!SAFE.test(e.data.sign))return;
        want=e.data.sign;
        if(customElements.get('model-viewer'))show(want);
      }else if(e.data.type===${JSON.stringify(VIEWER_PRELOAD)}&&Array.isArray(e.data.signs)){
        var signs=e.data.signs.filter(function(s){return typeof s==='string'&&SAFE.test(s);}).slice(0,MAX);
        queue=signs;
        customElements.whenDefined('model-viewer').then(arm);
      }
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

  return new Response(buildViewerHtml(sign).replace(/\n\s*/g, ""), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": buildViewerCsp(),
      "X-Frame-Options": "SAMEORIGIN",
      "Cache-Control": "no-cache",
    },
  });
}

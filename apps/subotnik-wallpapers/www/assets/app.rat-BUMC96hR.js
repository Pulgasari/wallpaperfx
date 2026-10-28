var ut=Object.defineProperty;var r=(t,a)=>ut(t,"name",{value:a,configurable:!0});import{z as _e,E as ee,G as ct,H as st,J as ft,K as Oe,P as vt,M as L,O as Ee,N as be,B as gt,Q as Be,l as dt,T as mt,V as Z,e as Y,h as d,w as U,W as Xe,X as Te,Y as He,Z as ht,_ as pt}from"./index-ChUwVxxM.js";import{p as bt,a as $t}from"./keys-CWTtq0D5.js";import"https://esm.sh/jsr/@pulgasari/str";import"https://esm.sh/jsr/@pulgasari/is";import"https://esm.sh/jsr/@pulgasari/logger";function E(t){let a=!1,e;const o=r(()=>(a||(e=t(),a=!0),e),"source");return{get value(){const i=o();return _e(i)?i.value:i},set value(i){const n=o();if(!_e(n))throw new TypeError("[rat] an imported reactive variant changes through its methods, it is not reassigned");n.value=i}}}r(E,"imported");function xt(t,a,e,o=null){const i=ee(()=>st(t(),a));return ct(()=>i.value.index,e.map((n,l)=>[l,()=>n(()=>i.value.parts??{})]),o)}r(xt,"cases");function g(t,{keys:a=null,prevent:e=!1,times:o=0}={}){const i=a?bt(a):null;let n=o;return function(l){if(!(o&&!n)&&!(i&&!$t(l,i))){e&&l.preventDefault(),o&&n--;try{const c=(typeof t=="string"?ft(t):t).call(this,l);typeof c?.catch=="function"&&c.catch(h=>Oe(this,h,"handler"))}catch(c){Oe(this,c,"handler")}}}}r(g,"listener");const ne=(function(){const t=`
        attribute vec2 aPosition;
        attribute vec2 aTexCoord;
        uniform vec2 uUvScale;
        uniform vec2 uUvOffset;
        uniform vec2 uPosScale;
        uniform vec2 uFlip;
        varying vec2 vTexCoord;
        varying vec2 vScreenCoord;
        void main() {
            vec2 uv = (aTexCoord - 0.5) * uUvScale + 0.5 + uUvOffset;
            uv = (uv - 0.5) * uFlip + 0.5;
            vTexCoord = uv;
            vScreenCoord = aTexCoord;
            gl_Position = vec4(aPosition * uPosScale, 0.0, 1.0);
        }`,a=`
        precision mediump float;
        varying vec2 vTexCoord;
        varying vec2 vScreenCoord;
        uniform sampler2D uTexture;
        uniform int uFilter;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        uniform float uScanCount;
        uniform float uScanStrength;
        uniform float uCrtMask;
        uniform float uAmount;
        uniform float uLevels;
        uniform float uPixelSize;
        uniform float uHalftone;
        uniform float uVignette;
        uniform float uVignetteRadius;
        uniform float uChromatic;
        uniform float uGrain;
        uniform float uGlitch;
        uniform float uVhs;
        uniform vec3 uVignetteColor;
        uniform float uBloom;
        uniform float uBloomThreshold;
        uniform float uBlurRadius;
        uniform float uFisheye;
        uniform float uNoise;
        uniform float uCycleSec;
        uniform float uTime;
        uniform vec2 uResolution;
        float luma(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
        void main() {
            vec2 uv = vTexCoord;
            if (uFilter == 7) {
                vec2 grid = uResolution / max(1.0, uPixelSize);
                uv = (floor(uv * grid) + 0.5) / grid;
            } else if (uFilter == 18) {
                vec2 cc = (uv - 0.5) * 2.0;
                float r2 = dot(cc, cc);
                uv = (cc * (1.0 + uFisheye * r2)) * 0.5 + 0.5;
            }
            vec4 c = texture2D(uTexture, uv);
            if (uFilter == 1) {
                c.rgb = mix(uColorA, uColorB, luma(c.rgb));
            } else if (uFilter == 3) {
                c.rgb = mix(c.rgb, vec3(luma(c.rgb)), uAmount);
            } else if (uFilter == 4) {
                float l = luma(c.rgb);
                vec3 sep = clamp(vec3(l) * vec3(1.07, 0.74, 0.43), 0.0, 1.0);
                c.rgb = mix(c.rgb, sep, uAmount);
            } else if (uFilter == 5) {
                float l = luma(c.rgb);
                vec3 low = mix(uColorA, uColorC, smoothstep(0.0, 0.5, l));
                c.rgb = mix(low, uColorB, smoothstep(0.5, 1.0, l));
            } else if (uFilter == 6) {
                float n = max(2.0, uLevels);
                c.rgb = floor(c.rgb * n) / (n - 1.0);
            } else if (uFilter == 12) {
                c.rgb = 1.0 - c.rgb;
            } else if (uFilter == 8) {
                float aspect = uResolution.x / max(1.0, uResolution.y);
                vec2 cell = vScreenCoord * vec2(uHalftone * aspect, uHalftone);
                vec2 center = floor(cell) + 0.5;
                float d = length(cell - center) * 2.0;
                float radius = sqrt(max(0.0, 1.0 - luma(c.rgb)));
                float cov = 1.0 - smoothstep(radius - 0.1, radius + 0.1, d);
                c.rgb = mix(uColorB, uColorA, cov);
            } else if (uFilter == 2) {
                float s = 0.5 + 0.5 * cos(vScreenCoord.y * uScanCount * 6.2831853);
                c.rgb *= (1.0 - uScanStrength * s);
            } else if (uFilter == 11) {
                float s = 0.5 + 0.5 * cos(vScreenCoord.y * uScanCount * 6.2831853);
                c.rgb *= (1.0 - uScanStrength * s);
                float m = mod(floor(vScreenCoord.x * uResolution.x), 3.0);
                vec3 mask = vec3(1.0 - uCrtMask);
                if (m < 1.0) mask.r = 1.0; else if (m < 2.0) mask.g = 1.0; else mask.b = 1.0;
                c.rgb *= mask;
                float dv = length(vScreenCoord - 0.5) * 1.4142136;
                c.rgb *= 1.0 - 0.4 * smoothstep(0.6, 1.0, dv);
            } else if (uFilter == 9) {
                float dv = length(vScreenCoord - 0.5) * 1.4142136;
                float v = uVignette * smoothstep(uVignetteRadius, 1.0, dv);
                c.rgb = mix(c.rgb, uVignetteColor, v);
            } else if (uFilter == 10) {
                vec2 off = (vScreenCoord - 0.5) * uChromatic;
                c.r = texture2D(uTexture, uv + off).r;
                c.b = texture2D(uTexture, uv - off).b;
            } else if (uFilter == 13) {
                float g = hash(vScreenCoord * uResolution + uTime * 60.0);
                c.rgb += (g - 0.5) * uGrain;
            } else if (uFilter == 14) {
                float band = floor(vScreenCoord.y * 24.0);
                float seed = floor(uTime * 12.0);
                float n = hash(vec2(band, seed));
                float shift = 0.0;
                if (n > 1.0 - 0.5 * uGlitch) { shift = (hash(vec2(band, seed + 1.0)) - 0.5) * 0.15 * uGlitch; }
                vec2 guv = vec2(uv.x + shift, uv.y);
                float amt = 0.006 * uGlitch;
                c.r = texture2D(uTexture, guv + vec2(amt, 0.0)).r;
                c.g = texture2D(uTexture, guv).g;
                c.b = texture2D(uTexture, guv - vec2(amt, 0.0)).b;
            } else if (uFilter == 15) {
                vec2 guv = vec2(uv.x + sin(uv.y * 120.0 + uTime * 5.0) * 0.0015 * uVhs, uv.y);
                float amt = 0.004 * uVhs;
                c.r = texture2D(uTexture, guv + vec2(amt, 0.0)).r;
                c.g = texture2D(uTexture, guv).g;
                c.b = texture2D(uTexture, guv - vec2(amt, 0.0)).b;
                float s = 0.5 + 0.5 * cos(vScreenCoord.y * 380.0 * 6.2831853);
                c.rgb *= (1.0 - 0.15 * uVhs * s);
                float g = hash(vScreenCoord * uResolution + uTime * 60.0);
                c.rgb += (g - 0.5) * 0.08 * uVhs;
                float track = fract(vScreenCoord.y - uTime * 0.2);
                c.rgb += smoothstep(0.97, 0.99, track) * 0.25 * uVhs;
            } else if (uFilter == 16) {
                vec2 px = 2.5 / uResolution;
                vec3 b = vec3(0.0); vec3 t;
                t = texture2D(uTexture, uv + px * vec2(-1.0, -1.0)).rgb; b += t * max(0.0, luma(t) - uBloomThreshold);
                t = texture2D(uTexture, uv + px * vec2( 0.0, -1.0)).rgb; b += t * max(0.0, luma(t) - uBloomThreshold);
                t = texture2D(uTexture, uv + px * vec2( 1.0, -1.0)).rgb; b += t * max(0.0, luma(t) - uBloomThreshold);
                t = texture2D(uTexture, uv + px * vec2(-1.0,  0.0)).rgb; b += t * max(0.0, luma(t) - uBloomThreshold);
                t = texture2D(uTexture, uv + px * vec2( 0.0,  0.0)).rgb; b += t * max(0.0, luma(t) - uBloomThreshold);
                t = texture2D(uTexture, uv + px * vec2( 1.0,  0.0)).rgb; b += t * max(0.0, luma(t) - uBloomThreshold);
                t = texture2D(uTexture, uv + px * vec2(-1.0,  1.0)).rgb; b += t * max(0.0, luma(t) - uBloomThreshold);
                t = texture2D(uTexture, uv + px * vec2( 0.0,  1.0)).rgb; b += t * max(0.0, luma(t) - uBloomThreshold);
                t = texture2D(uTexture, uv + px * vec2( 1.0,  1.0)).rgb; b += t * max(0.0, luma(t) - uBloomThreshold);
                c.rgb += (b / 9.0) * uBloom * 4.0;
            } else if (uFilter == 17) {
                vec2 px = uBlurRadius / uResolution;
                vec3 s = texture2D(uTexture, uv).rgb * 4.0;
                s += texture2D(uTexture, uv + vec2( px.x, 0.0)).rgb * 2.0;
                s += texture2D(uTexture, uv + vec2(-px.x, 0.0)).rgb * 2.0;
                s += texture2D(uTexture, uv + vec2(0.0,  px.y)).rgb * 2.0;
                s += texture2D(uTexture, uv + vec2(0.0, -px.y)).rgb * 2.0;
                s += texture2D(uTexture, uv + vec2( px.x,  px.y)).rgb;
                s += texture2D(uTexture, uv + vec2( px.x, -px.y)).rgb;
                s += texture2D(uTexture, uv + vec2(-px.x,  px.y)).rgb;
                s += texture2D(uTexture, uv + vec2(-px.x, -px.y)).rgb;
                c.rgb = s / 16.0;
            } else if (uFilter == 19) {
                float g = hash(vScreenCoord * uResolution);
                c.rgb += (g - 0.5) * uGrain;
            } else if (uFilter == 20) {
                vec2 sp = vScreenCoord * uResolution;
                vec3 n = vec3(hash(sp + 1.0), hash(sp + 2.0), hash(sp + 3.0));
                c.rgb += (n - 0.5) * uNoise;
            } else if (uFilter == 21) {
                float ph = 0.5 + 0.5 * sin(uTime * 6.2831853 / max(0.5, uCycleSec));
                vec3 hi = mix(uColorB, uColorC, ph);
                c.rgb = mix(uColorA, hi, luma(c.rgb));
            }
            gl_FragColor = c;
        }`;let e,o,i,n,l,c=null,h=null,T=!1,I=1.5,R=null,p=null,B=null,y=null,X=!1,S=1,V=1,F=null,W=null,m=0,k=0;const j=[1,1,0,0,1,1],H=[1,1];function _(f){return window.Capacitor&&typeof window.Capacitor.convertFileSrc=="function"?window.Capacitor.convertFileSrc(f):f}r(_,"toSrc");function q(f,v){const u=e.createShader(f);return e.shaderSource(u,v),e.compileShader(u),e.getShaderParameter(u,e.COMPILE_STATUS)||console.error("preview shader error:",e.getShaderInfoLog(u)),u}r(q,"compile");function Ke(f){return o=f,o?(e=o.getContext("webgl")||o.getContext("experimental-webgl"),e?(i=e.createProgram(),e.attachShader(i,q(e.VERTEX_SHADER,t)),e.attachShader(i,q(e.FRAGMENT_SHADER,a)),e.linkProgram(i),e.getProgramParameter(i,e.LINK_STATUS)?(n={aPosition:e.getAttribLocation(i,"aPosition"),aTexCoord:e.getAttribLocation(i,"aTexCoord")},["uUvScale","uUvOffset","uPosScale","uFlip","uFilter","uColorA","uColorB","uColorC","uScanCount","uScanStrength","uCrtMask","uAmount","uLevels","uPixelSize","uHalftone","uVignette","uVignetteRadius","uChromatic","uGrain","uGlitch","uVhs","uVignetteColor","uBloom","uBloomThreshold","uBlurRadius","uFisheye","uNoise","uCycleSec","uTime","uResolution","uTexture"].forEach(v=>n[v]=e.getUniformLocation(i,v)),l=e.createBuffer(),e.bindBuffer(e.ARRAY_BUFFER,l),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,0,0,1,-1,1,0,-1,1,0,1,1,1,1,1]),e.STATIC_DRAW),e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL,!0),e.clearColor(0,0,0,1),me(),addEventListener("resize",me),requestAnimationFrame(Fe),!0):(console.error("preview link error:",e.getProgramInfoLog(i)),!1)):(o.parentElement.classList.add("no-gl"),!1)):!1}r(Ke,"init");function me(){if(!o)return;const f=Math.min(window.devicePixelRatio||1,I),v=window.innerWidth,u=window.innerHeight;o.style.width=v+"px",o.style.height=u+"px",o.width=Math.max(1,Math.round(v*f)),o.height=Math.max(1,Math.round(u*f))}r(me,"resize");function Je(f){h=f,c=h()}r(Je,"attach");function Qe(){if(h&&(c=h()),!e||!c)return;let f=null,v=null;if(c.mode==="video"){const u=(c.videos||[]).find(s=>s.enabled);u&&(f=_(u.path),v="video")}else if(c.mode==="images"){const u=(c.images||[]).find(s=>s.enabled);u&&(f=_(u.path),v="image")}if(!(f===B&&v===R)&&(Ze(),B=f,R=v,!!f))if(v==="image"){const u=new Image;u.onload=()=>{S=u.naturalWidth||1,V=u.naturalHeight||1,Ae(u),X=!0},u.onerror=()=>console.warn("preview: image load failed",f),u.src=f,p=u}else{const u=document.createElement("video");u.src=f,u.muted=!0,u.loop=!0,u.playsInline=!0,u.setAttribute("playsinline",""),u.addEventListener("loadeddata",()=>{S=u.videoWidth||1,V=u.videoHeight||1}),T||u.play().catch(()=>{}),p=u}}r(Qe,"refreshMedia");function Ze(){if(R==="video"&&p){try{p.pause()}catch{}p.src=""}p=null,X=!1,y&&(e.deleteTexture(y),y=null)}r(Ze,"teardownSource");function Ae(f){y||(y=e.createTexture(),e.bindTexture(e.TEXTURE_2D,y),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE)),e.bindTexture(e.TEXTURE_2D,y),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,e.RGBA,e.UNSIGNED_BYTE,f)}r(Ae,"uploadTexture");function et(){const f=o.width/o.height,v=S/V/f,u=c.mode==="video"?c.videoScale:c.imageScale,s=c.mode==="video"?c.videoOffsetX:c.imageOffsetX,x=c.mode==="video"?c.videoOffsetY:c.imageOffsetY;let C=1,w=1,z=0,K=0,J=1,pe=1;if(u==="fit")J=Math.min(1,v),pe=Math.min(1,1/v);else{if(C=Math.min(1,1/v),w=Math.min(1,v),c.parallaxEnabled){const Me=Math.max(0,Math.min(.9,c.parallaxAmount));C*=1-Me,w*=1-Me}z=Q(s,-1,1)*(1-C)*.5,K=Q(x,-1,1)*(1-w)*.5;const ke=[C,w,z,K,J,pe];return tt(ke),ke}return[C,w,z,K,J,pe]}r(et,"computeScale");function tt(f){const v=c.motionType||"none";if(v==="none")return;const u=performance.now()/1e3,s=Q(c.motionAmount,0,1),x=.3+Q(c.motionSpeed,0,1)*1.2;let C=1,w=0,z=0;if(v==="zoom")C=1-.18*s*(.5-.5*Math.cos(u*x*.6));else if(v==="breathe")C=1-.12*s*(.5+.5*Math.sin(u*x));else if(v==="drift")C=1-.18*s,w=Math.sin(u*x*.5),z=Math.cos(u*x*.37);else if(v==="sway")C=1-.1*s,w=Math.sin(u*x*.8),z=.2*Math.sin(u*x*.4);else if(v==="shake")C=1-.08*s,w=.5*(Math.sin(u*17)+Math.sin(u*29)),z=.5*(Math.sin(u*23)+Math.sin(u*31));else return;f[0]*=C,f[1]*=C;const K=(1-f[0])*.5,J=(1-f[1])*.5;f[2]=Q(f[2]+w*K*s,-K,K),f[3]=Q(f[3]+z*J*s,-J,J)}r(tt,"applyMotion");function Q(f,v,u){return Math.max(v,Math.min(u,f))}r(Q,"clamp");function O(f,v){return(f&&f[v]!=null?f[v]:0)/255}r(O,"rgb");const nt={none:0,duotone:1,scanlines:2,grayscale:3,sepia:4,gradientmap:5,posterize:6,pixelate:7,halftone:8,vignette:9,chromatic:10,crt:11,invert:12,filmgrain:13,glitch:14,vhs:15,bloom:16,blur:17,fisheye:18,grain:19,noise:20,duotone2:21};function rt(f){return nt[f]||0}r(rt,"filterIndex");function Fe(){h&&(c=h()),T||it(),requestAnimationFrame(Fe)}r(Fe,"loop");function we(f){if(T=!!f,R==="video"&&p)if(T)try{p.pause()}catch{}else p.play().catch(()=>{})}r(we,"setPaused");function at(){return we(!T),T}r(at,"togglePaused");function ot(f){const v=Number(f);v>0&&(I=v,me())}r(ot,"setQuality");function Pe(f,v){const u=e.createTexture();e.bindTexture(e.TEXTURE_2D,u),e.texImage2D(e.TEXTURE_2D,0,e.RGBA,f,v,0,e.RGBA,e.UNSIGNED_BYTE,null),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);const s=e.createFramebuffer();return e.bindFramebuffer(e.FRAMEBUFFER,s),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,u,0),e.bindFramebuffer(e.FRAMEBUFFER,null),{fb:s,tex:u}}r(Pe,"createFbo");function lt(){F&&m===o.width&&k===o.height||(F&&(e.deleteFramebuffer(F.fb),e.deleteTexture(F.tex),e.deleteFramebuffer(W.fb),e.deleteTexture(W.tex)),m=o.width,k=o.height,F=Pe(m,k),W=Pe(m,k))}r(lt,"ensureFbos");function he(f,v,u,s,x){e.bindFramebuffer(e.FRAMEBUFFER,f),e.viewport(0,0,o.width,o.height),e.useProgram(i),e.bindBuffer(e.ARRAY_BUFFER,l),e.enableVertexAttribArray(n.aPosition),e.vertexAttribPointer(n.aPosition,2,e.FLOAT,!1,16,0),e.enableVertexAttribArray(n.aTexCoord),e.vertexAttribPointer(n.aTexCoord,2,e.FLOAT,!1,16,8),e.uniform2f(n.uUvScale,u[0],u[1]),e.uniform2f(n.uUvOffset,u[2],u[3]),e.uniform2f(n.uPosScale,u[4],u[5]),e.uniform2f(n.uFlip,x[0],x[1]),e.uniform1f(n.uTime,performance.now()/1e3),e.uniform2f(n.uResolution,o.width,o.height),s?(e.uniform1i(n.uFilter,rt(s.type)),e.uniform3f(n.uColorA,O(s.colorA,0),O(s.colorA,1),O(s.colorA,2)),e.uniform3f(n.uColorB,O(s.colorB,0),O(s.colorB,1),O(s.colorB,2)),e.uniform3f(n.uColorC,O(s.colorC,0),O(s.colorC,1),O(s.colorC,2)),e.uniform1f(n.uScanCount,s.scanCount),e.uniform1f(n.uScanStrength,s.scanStrength),e.uniform1f(n.uCrtMask,s.crtMask),e.uniform1f(n.uAmount,s.amount),e.uniform1f(n.uLevels,s.levels),e.uniform1f(n.uPixelSize,s.pixelSize),e.uniform1f(n.uHalftone,s.halftone),e.uniform1f(n.uVignette,s.vignette),e.uniform1f(n.uVignetteRadius,s.vignetteRadius),e.uniform3f(n.uVignetteColor,O(s.vignetteColor,0),O(s.vignetteColor,1),O(s.vignetteColor,2)),e.uniform1f(n.uChromatic,s.chromatic),e.uniform1f(n.uGrain,s.grain),e.uniform1f(n.uGlitch,s.glitch),e.uniform1f(n.uVhs,s.vhs),e.uniform1f(n.uBloom,s.bloom),e.uniform1f(n.uBloomThreshold,s.bloomThreshold),e.uniform1f(n.uBlurRadius,s.blurRadius),e.uniform1f(n.uFisheye,s.fisheye),e.uniform1f(n.uNoise,s.noise),e.uniform1f(n.uCycleSec,s.cycleSec)):e.uniform1i(n.uFilter,0),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,v),e.uniform1i(n.uTexture,0),e.drawArrays(e.TRIANGLE_STRIP,0,4)}r(he,"drawPass");function it(){if(!e)return;if(!c||!p){e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,o.width,o.height),e.clear(e.COLOR_BUFFER_BIT);return}if(R==="video"){const x=c.videoSpeed||1;p.playbackRate!==x&&(p.playbackRate=x),p.readyState>=2&&(S=p.videoWidth||S,V=p.videoHeight||V,Ae(p),X=!0)}if(!X||!y){e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,o.width,o.height),e.clear(e.COLOR_BUFFER_BIT);return}lt();const f=[c.flipX?-1:1,c.flipY?-1:1];e.bindFramebuffer(e.FRAMEBUFFER,F.fb),e.viewport(0,0,o.width,o.height),e.clear(e.COLOR_BUFFER_BIT),he(F.fb,y,et(),null,f);const v=(c.filters||[]).filter(x=>x.enabled&&x.type!=="none");if(v.length===0){he(null,F.tex,j,null,H);return}let u=F.tex,s=F;for(let x=0;x<v.length;x++){const C=x===v.length-1,w=s===F?W:F;he(C?null:w.fb,u,j,v[x],H),C||(u=w.tex,s=w)}}return r(it,"render"),{init:Ke,attach:Je,refreshMedia:Qe,setPaused:we,togglePaused:at,setQuality:ot,isPaused:r(()=>T,"isPaused")}})();globalThis.Capacitor?.isNativePlatform?.();const St=r((t,a={})=>globalThis.Capacitor?.Plugins?.[t]??a,"plugin"),le=St("Wallpaper",{applyWallpaper:r(async()=>alert("nur im nativen build: live-wallpaper-auswahl wird geöffnet"),"applyWallpaper"),getConfig:r(async()=>JSON.parse(localStorage.getItem("wallpaper")??"{}"),"getConfig"),pickMedia:r(async({type:t})=>({paths:[`/mock/${Date.now()}_${t==="image"?"demo_image.jpg":"demo_video.mp4"}`]}),"pickMedia"),setConfig:r(async({config:t})=>localStorage.setItem("wallpaper",JSON.stringify(t)),"setConfig")}),se={mode:"video",videos:[],videoOrder:"loop",videoScale:"cover",videoOffsetX:0,videoOffsetY:0,videoSpeed:1,resumeVideo:!0,images:[],imageOrder:"loop",imageDurationMs:8e3,imageTransitionMs:800,imageScale:"cover",imageOffsetX:0,imageOffsetY:0,flipX:!1,flipY:!1,filters:[],parallaxEnabled:!1,parallaxAmount:.15,motionType:"none",motionAmount:.5,motionSpeed:.5},Tt=r(t=>({type:t,enabled:!0,colorA:[18,20,42],colorB:[240,186,72],colorC:[120,84,168],scanCount:320,scanStrength:.35,crtMask:.3,amount:1,levels:6,pixelSize:12,halftone:90,vignette:.6,vignetteRadius:.6,vignetteColor:[0,0,0],chromatic:.006,grain:.15,glitch:.5,vhs:.6,bloom:.6,bloomThreshold:.7,blurRadius:2,fisheye:.5,noise:.15,cycleSec:6}),"filterOf"),Ue=[["bloom","Bloom"],["blur","Blur"],["chromatic","Chromatic"],["crt","CRT"],["duotone","Duotone"],["duotone2","Duotone Cycle"],["filmgrain","Film Grain"],["fisheye","Fisheye"],["glitch","Glitch"],["gradientmap","Gradient Map"],["grain","Grain"],["grayscale","Graustufen"],["halftone","Halftone"],["invert","Invertieren"],["noise","Noise"],["pixelate","Pixelate"],["posterize","Posterize"],["scanlines","Scanlines"],["sepia","Sepia"],["vhs","VHS"],["vignette","Vignette"]],yt=Object.fromEntries(Ue),Rt=["duotone2","filmgrain","glitch","vhs"],Et={bloom:[["bloom","Stärke",0,2,.01,2],["bloomThreshold","Schwelle",0,1,.01,2]],blur:[["blurRadius","Radius",.5,8,.1,1]],chromatic:[["chromatic","Versatz",0,.03,.001,3]],crt:[["scanCount","Linien",60,900,10,0],["scanStrength","Stärke",0,1,.01,2],["crtMask","Maske",0,1,.01,2]],duotone:[["colorA","Schatten","color"],["colorB","Lichter","color"]],duotone2:[["colorA","Schatten","color"],["colorB","Licht A","color"],["colorC","Licht B","color"],["cycleSec","Dauer",.5,20,.5,1]],filmgrain:[["grain","Körnung",0,.6,.01,2]],fisheye:[["fisheye","Stärke",-1,1,.01,2]],glitch:[["glitch","Stärke",0,1,.01,2]],gradientmap:[["colorA","Dunkel","color"],["colorC","Mitte","color"],["colorB","Hell","color"]],grain:[["grain","Körnung",0,.6,.01,2]],grayscale:[["amount","Stärke",0,1,.01,2]],halftone:[["colorA","Ink","color"],["colorB","Paper","color"],["halftone","Raster",20,240,5,0]],invert:[],noise:[["noise","Stärke",0,.6,.01,2]],pixelate:[["pixelSize","Blockgröße",2,64,1,0]],posterize:[["levels","Stufen",2,16,1,0]],scanlines:[["scanCount","Linien",60,900,10,0],["scanStrength","Stärke",0,1,.01,2]],sepia:[["amount","Stärke",0,1,.01,2]],vhs:[["vhs","Stärke",0,1,.01,2]],vignette:[["vignette","Stärke",0,1,.01,2],["vignetteRadius","Radius",0,1,.01,2],["vignetteColor","Farbe","color"]]};function Ct(t={}){const a={...se};for(const e of Object.keys(se))t[e]!=null&&(a[e]=t[e]);return Array.isArray(t.imagePaths)&&!a.images.length&&(a.images=t.imagePaths.map(e=>({enabled:!0,path:e}))),t.videoPath&&!a.videos.length&&(a.videos=[{enabled:!0,path:t.videoPath}]),a.imageOrder={normal:"loop",random:"loop-random"}[a.imageOrder]??a.imageOrder,a}r(Ct,"adopt$1");const At=r(t=>JSON.parse(JSON.stringify(t)),"plain"),de={apply:r(()=>le.applyWallpaper(),"apply"),load:r(async()=>Ct(await le.getConfig().catch(()=>({}))),"load"),pick:r(async t=>(await le.pickMedia({type:t}))?.paths??[],"pick"),save:r(t=>le.setConfig({config:At(t)}),"save")},Ft=r(t=>globalThis.Capacitor?.convertFileSrc?.(t)??t,"srcOf");function wt(t=""){const a=t.split("/").pop(),e=a.indexOf("_");return e>0&&/^\d+$/.test(a.slice(0,e))?a.slice(e+1):a}r(wt,"nameOf");const Pt=r(t=>`#${t.map(a=>Math.max(0,Math.min(255,a)).toString(16).padStart(2,"0")).join("")}`,"toHex"),kt=r(t=>[0,2,4].map(a=>parseInt(t.replace("#","").slice(a,a+2),16)),"toRgb"),ie=r(t=>(a,e)=>vt.notify(a,{...e,type:t}),"notify"),G=Object.assign(ie("info"),{error:ie("error"),info:ie("info"),success:ie("success")});let $=L({...se});const b=r((t,a)=>{$.value={...$.value,[t]:a}},"set");async function Mt(){$.value=await de.load()}r(Mt,"load");async function Ce(){try{return await de.save($.value),G("gespeichert"),!0}catch{return G.error("fehler beim speichern"),!1}}r(Ce,"save");async function _t(){if(!ze.value)return G($.value.mode==="video"?"erst ein video wählen":"erst bilder wählen");if(await Ce())try{await de.apply()}catch{G.error("konnte wallpaper-auswahl nicht öffnen")}}r(_t,"apply");const Ie=r((t,a,e)=>{const o=[...t];return o.splice(e,0,...o.splice(a,1)),o},"moved"),Ot=r(()=>$.value.mode==="video"?"videos":"images","listKey"),te=ee(()=>$.value.mode==="video"?$.value.videos:$.value.images),ze=ee(()=>te.value.some(t=>t.enabled)),oe=r(t=>b(Ot(),t),"setSources");async function De(){try{const t=await de.pick($.value.mode==="video"?"video":"image");t.length&&oe([...te.value,...t.map(a=>({enabled:!0,path:a}))])}catch{G("auswahl abgebrochen")}}r(De,"addSources");const Bt=r(t=>oe(te.value.map((a,e)=>e===t?{...a,enabled:!a.enabled}:a)),"toggleSource"),Dt=r(t=>oe(te.value.filter((a,e)=>e!==t)),"removeSource"),Lt=r((t,a)=>oe(Ie(te.value,t,a)),"moveSource"),Xt=r(()=>oe([]),"clearSources");let A=L(null);function Ht(){b("filters",[...$.value.filters,Tt("duotone")]),A.value=$.value.filters.length-1}r(Ht,"addFilter");const Ut=r(t=>b("filters",$.value.filters.map((a,e)=>e===t?{...a,enabled:!a.enabled}:a)),"toggleFilter"),$e=r((t,a,e)=>b("filters",$.value.filters.map((o,i)=>i===t?{...o,[a]:e}:o)),"setFilter");function It(t){b("filters",$.value.filters.filter((a,e)=>e!==t)),A.value===t?A.value=null:A.value>t&&A.value--}r(It,"removeFilter");function zt(t,a){b("filters",Ie($.value.filters,t,a)),A.value!==null&&(A.value===t?A.value=a:t<A.value&&A.value<=a?A.value--:a<=A.value&&A.value<t&&A.value++)}r(zt,"moveFilter");const ye=["mode","videos","images"],Le=Object.keys(se).filter(t=>!ye.includes(t)),fe={config:Le,source:ye,wallpaper:[...ye,...Le]};let D=Ee("presets",{config:[],source:[],wallpaper:[]});const Ne=r(t=>JSON.parse(JSON.stringify(t)),"copy");function Nt(t,a){const e=D.value[t],o=a.trim()||`preset ${e.length+1}`,i=Object.fromEntries(fe[t].map(l=>[l,Ne($.value[l])])),n=e.some(l=>l.name===o)?e.map(l=>l.name===o?{data:i,name:o}:l):[...e,{data:i,name:o}];D.value={...D.value,[t]:n},G(`gespeichert: ${o}`)}r(Nt,"savePreset");function Yt(t,a){const{data:e,name:o}=D.value[t][a],i=Object.fromEntries(fe[t].filter(n=>e[n]!==void 0).map(n=>[n,Ne(e[n])]));$.value={...$.value,...i},A.value=null,G(`geladen: ${o}`)}r(Yt,"loadPreset");const Gt=r((t,a)=>{D.value={...D.value,[t]:D.value[t].filter((e,o)=>o!==a)}},"deletePreset"),Ye={accent:dt.default("#f0ba48"),gridSize:be.range(56,140).default(84),mode:Be("system","dark","light"),quality:Be(1.5,1,.75),rounded:gt.default(!0),spaceScale:be.range(.5,1.8).default(1),uiScale:be.range(.8,1.6).default(1)},M=Ee("look",mt(Ye).create());let Ge=Ee("panelHeight",null);const xe=[["config","Config"],["filters","Filter"],["motion","Bewegung"],["parallax","Parallax"]];let ae=L(null),Re=L(null),Vt=L(!1);const ce=r(t=>{ae.value=ae.value===t?null:t},"toggleOverlay"),Ve=r(()=>{ae.value=null},"closeOverlay"),Wt=r(t=>{Re.value=Re.value===t?null:t},"toggleTab");function jt(){const t=r(n=>{try{return JSON.parse(localStorage.getItem(n)??"null")}catch{return null}},"read"),a=t("wpfx_theme");a&&M.assign(Object.fromEntries(Object.keys(Ye).filter(n=>n in a).map(n=>[n,a[n]])));const e=t("wpfx_preview_quality");e&&(M.quality=Number(e));const o=t("wpfx_panel_h");o&&(Ge.value=o);const i=Object.fromEntries(Object.keys(fe).map(n=>[n,t(`wpfx_presets_${n}`)]).filter(([,n])=>Array.isArray(n)));Object.keys(i).length&&(D.value={...D.value,...i});for(const n of["wpfx_theme","wpfx_preview_quality","wpfx_panel_h",...Object.keys(fe).map(l=>`wpfx_presets_${l}`)])localStorage.removeItem(n)}r(jt,"adopt");jt();const ve=r(t=>[0,2,4].map(a=>parseInt(t.replace("#","").slice(a,a+2),16)),"rgbOf"),qt=r(t=>`#${t.map(a=>Math.max(0,Math.min(255,a)).toString(16).padStart(2,"0")).join("")}`,"hexOf"),Kt=r((t,a,e)=>{const[o,i]=[ve(t),ve(a)];return qt(o.map((n,l)=>Math.round(n+(i[l]-n)*e)))},"mix"),ue=r((t,a)=>`rgba(${ve(t).join(", ")}, ${a})`,"rgba"),Jt=r(t=>{const[a,e,o]=ve(t).map(i=>i/255);return .299*a+.587*e+.114*o>.6?"#1a1508":"#ffffff"},"inkOf"),We=matchMedia("(prefers-color-scheme: dark)");let je=L(We.matches);We.addEventListener("change",t=>{je.value=t.matches});const Se=ee(()=>M.mode==="system"?je.value:M.mode==="dark");Z(()=>{const t=Se.value?"#0d0f16":"#eef0f5",a=Se.value?"#e9ecf5":"#14161d",e=document.documentElement.style;e.setProperty("--text",a),e.setProperty("--muted",Kt(t,a,.62)),e.setProperty("--card",ue(a,.05)),e.setProperty("--card-2",ue(a,.09)),e.setProperty("--line",ue(a,.15)),e.setProperty("--accent",M.accent),e.setProperty("--accent-ink",Jt(M.accent)),e.setProperty("--sheet-bg",ue(t,.82)),e.setProperty("--radius",M.rounded?"14px":"3px"),e.setProperty("--radius-lg",M.rounded?"18px":"4px"),e.setProperty("--tile",`${M.gridSize}px`),e.setProperty("--ui-scale",M.uiScale),e.setProperty("--space-scale",M.spaceScale),document.documentElement.dataset.theme=Se.value?"dark":"light"});function N(t,a){return Qt.call({props:t},t,a)}r(N,"ChoiceRatHtml");function Qt(t,a){return d`
    <label.field>
      <span>${()=>t.label}</span>
      <select onchange=${g(r(o=>t.onchange(t.options.find(([i])=>String(i)===o.currentTarget.value)?.[0]),"pick"))}>
        ${Y(()=>t.options,o=>o,o=>d`<option value=${()=>o[0]} selected=${()=>String(o[0])===String(t.value)}>${()=>o[1]}</option>`)}
      </select>
    </label>
  `}r(Qt,"$$ChoiceRatHtml");function P(t,a){return Zt.call({props:t},t,a)}r(P,"RangeRatHtml");function Zt(t,a){const e=r(o=>t.format?t.format(o):(o/(t.scale??1)).toFixed(t.digits??2),"shown");return d`
    <label.field>
      <span>${()=>t.label} <em>${()=>e(t.value)}${()=>t.unit??""}</em></span>
      <input type="range" min=${()=>t.min} max=${()=>t.max} step=${()=>t.step} value=${()=>t.value} oninput=${g(o=>t.onchange(Number(o.currentTarget.value)))} />
    </label>
  `}r(Zt,"$$RangeRatHtml");function re(t,a){return en.call({props:t},t,a)}r(re,"ToggleRatHtml");function en(t,a){return d`
    <label.field.row>
      <span>${()=>t.label}</span>
      <input type="checkbox" checked=${()=>t.value} onchange=${g(e=>t.onchange(e.currentTarget.checked))} />
    </label>
  `}r(en,"$$ToggleRatHtml");function tn(t,a){return nn.call({props:t},t,a)}r(tn,"ConfigPageRatHtml");function nn(t,a){const e=E(()=>$),o=[["loop","Loop (der Reihe nach)"],["loop-random","Loop zufällig"]],i=[["cover","Cover (ausfüllen, beschneiden)"],["fit","Fit (einpassen, ränder)"]];return d`
    ${U(()=>e.value.mode==="video",()=>d`
        <section.panel>
          <${N} label="Modus" ...${{get value(){return e.value.videoOrder},get options(){return[...o,["single","Einzeln (ein Video, zufällig)"]]},onchange:r(n=>b("videoOrder",n),"onchange")}} />
          <${re} label="Position merken" ...${{get value(){return e.value.resumeVideo},onchange:r(n=>b("resumeVideo",n),"onchange")}} />
          <${N} label="Skalierung" ...${{get value(){return e.value.videoScale},get options(){return i},onchange:r(n=>b("videoScale",n),"onchange")}} />
          <${P} label="Geschwindigkeit" unit="x" ...${{get value(){return e.value.videoSpeed},get min(){return .25},get max(){return 3},get step(){return .05},onchange:r(n=>b("videoSpeed",n),"onchange")}} />
          <${P} label="Offset X" ...${{get value(){return e.value.videoOffsetX},get min(){return-1},get max(){return 1},get step(){return .01},onchange:r(n=>b("videoOffsetX",n),"onchange")}} />
          <${P} label="Offset Y" ...${{get value(){return e.value.videoOffsetY},get min(){return-1},get max(){return 1},get step(){return .01},onchange:r(n=>b("videoOffsetY",n),"onchange")}} />
        </section>
      `,()=>d`
        <section.panel>
          <${N} label="Modus" ...${{get value(){return e.value.imageOrder},get options(){return[...o,["single","Einzeln (ein Bild, zufällig)"]]},onchange:r(n=>b("imageOrder",n),"onchange")}} />
          <${P} label="Anzeigedauer" unit=" s" ...${{get digits(){return 1},get scale(){return 1e3},get value(){return e.value.imageDurationMs},get min(){return 100},get max(){return 6e4},get step(){return 100},onchange:r(n=>b("imageDurationMs",n),"onchange")}} />
          <${P} label="Überblendung" unit=" s" ...${{get digits(){return 1},get scale(){return 1e3},get value(){return e.value.imageTransitionMs},get min(){return 0},get max(){return 3e3},get step(){return 100},onchange:r(n=>b("imageTransitionMs",n),"onchange")}} />
          <${N} label="Skalierung" ...${{get value(){return e.value.imageScale},get options(){return i},onchange:r(n=>b("imageScale",n),"onchange")}} />
          <${P} label="Offset X" ...${{get value(){return e.value.imageOffsetX},get min(){return-1},get max(){return 1},get step(){return .01},onchange:r(n=>b("imageOffsetX",n),"onchange")}} />
          <${P} label="Offset Y" ...${{get value(){return e.value.imageOffsetY},get min(){return-1},get max(){return 1},get step(){return .01},onchange:r(n=>b("imageOffsetY",n),"onchange")}} />
        </section>
      `)}
    <div.subhead>Spiegeln</div>
    <${re} label="X-Achse (horizontal)" ...${{get value(){return e.value.flipX},onchange:r(n=>b("flipX",n),"onchange")}} />
    <${re} label="Y-Achse (vertikal)" ...${{get value(){return e.value.flipY},onchange:r(n=>b("flipY",n),"onchange")}} />
  `}r(nn,"$$ConfigPageRatHtml");const rn=8;function an(t,a,e){let o=null,i=1/0;for(const n of t){const l=n.getBoundingClientRect(),c=l.left+l.width/2,h=l.top+l.height/2;if(e<h-1||e<h+l.height/2&&a<c){const T=Math.hypot(a-c,e-h);T<i&&(i=T,o=n)}}return o}r(an,"before");function qe(t,a){let e=a;function o(i){const n=i.target.closest(".tile[data-index]");if(!n||!t.contains(n)||i.target.closest(".tile-x, .tile-toggle"))return;const l=Number(n.dataset.index),c=i.clientX,h=i.clientY;let T=!1;const I=r(p=>{const B=p.clientX-c,y=p.clientY-h;if(!T){if(Math.hypot(B,y)<rn)return;T=!0,n.classList.add("dragging");try{n.setPointerCapture(p.pointerId)}catch{}}n.style.transform=`translate(${B}px, ${y}px)`},"move"),R=r(p=>{t.removeEventListener("pointermove",I),t.removeEventListener("pointerup",R),t.removeEventListener("pointercancel",R);try{n.releasePointerCapture(p.pointerId)}catch{}if(!T)return e.tap?.(l);if(n.classList.remove("dragging"),n.style.transform="",p.type==="pointercancel")return;const B=[...t.querySelectorAll(".tile[data-index]")].filter(S=>S!==n),y=an(B,p.clientX,p.clientY),X=y?B.indexOf(y):B.length;X!==l&&e.move?.(l,X)},"up");t.addEventListener("pointermove",I),t.addEventListener("pointerup",R),t.addEventListener("pointercancel",R)}return r(o,"down"),t.addEventListener("pointerdown",o),{destroy:r(()=>t.removeEventListener("pointerdown",o),"destroy"),update:r(i=>{e=i},"update")}}r(qe,"reorder");function on(t,a){return ln.call({props:t},t,a)}r(on,"FiltersPageRatHtml");function ln(t,a){const e=E(()=>$),o=E(()=>A),i=ee(()=>o.value===null?null:e.value.filters[o.value]??null);return d`
    <div.tile-grid ref=${Xe(qe,()=>({move:zt,tap:r(n=>o.value=n,"tap")}))}>
      ${Y(()=>e.value.filters,n=>n,(n,l)=>d`
          <div.tile.filter-tile class:disabled=${()=>!n.enabled} class:selected=${()=>l===o.value} data-index=${()=>l}>
            <span.tile-label>${()=>yt[n.type]??n.type}</span>
            <button.tile-toggle class:on=${()=>n.enabled} type="button" title="aktiv" onclick=${g(()=>Ut(l))} />
            <button.tile-x type="button" title="entfernen" onclick=${g(()=>It(l))}>✕</button>
          </div>
        `)}
      <button.tile.tile-add type="button" title="filter hinzufügen" onclick=${g(Ht)}>+</button>
    </div>
    ${U(()=>i.value,()=>d`
        <div.tile-editor>
          <${N} label="Typ" ...${{get value(){return i.value.type},get options(){return Ue},onchange:r(n=>$e(o.value,"type",n),"onchange")}} />
          ${Y(()=>Et[i.value.type]??[],n=>n,n=>d`
              ${U(()=>n[2]==="color",()=>d`
                  <label.field>
                    <span>${()=>n[1]}</span>
                    <input type="color" value=${()=>Pt(i.value[n[0]])} oninput=${g(l=>$e(o.value,n[0],kt(l.currentTarget.value)))} />
                  </label>
                `,()=>d`<${P} ...${{get label(){return n[1]},get value(){return i.value[n[0]]},get min(){return n[2]},get max(){return n[3]},get step(){return n[4]},get format(){return l=>n[5]?Number(l).toFixed(n[5]):String(l)},onchange:r(l=>$e(o.value,n[0],l),"onchange")}} />`)}
            `)}
          ${U(()=>Rt.includes(i.value.type),()=>d`<p.muted>animiert: läuft kontinuierlich, mehr akku.</p>`)}
        </div>
      `)}
  `}r(ln,"$$FiltersPageRatHtml");function un(t,a){return cn.call({props:t},t,a)}r(un,"MotionPageRatHtml");function cn(t,a){const e=E(()=>$),o=[["none","Kein"],["zoom","Zoom (rein/raus)"],["breathe","Atmen"],["drift","Drift"],["sway","Schaukeln"],["shake","Wackeln"]];return d`
    <${N} label="Typ" ...${{get value(){return e.value.motionType},get options(){return o},onchange:r(i=>b("motionType",i),"onchange")}} />
    ${U(()=>e.value.motionType!=="none",()=>d`
        <${P} label="Stärke" ...${{get value(){return e.value.motionAmount},get min(){return 0},get max(){return 1},get step(){return .01},onchange:r(i=>b("motionAmount",i),"onchange")}} />
        <${P} label="Tempo" ...${{get value(){return e.value.motionSpeed},get min(){return 0},get max(){return 1},get step(){return .01},onchange:r(i=>b("motionSpeed",i),"onchange")}} />
        <p.muted>bewegung rendert kontinuierlich solange sichtbar, verbraucht mehr akku.</p>
      `)}
  `}r(cn,"$$MotionPageRatHtml");function sn(t,a){return fn.call({props:t},t,a)}r(sn,"ParallaxPageRatHtml");function fn(t,a){const e=E(()=>$);return d`
    <${re} label="Beim Wischen bewegen" ...${{get value(){return e.value.parallaxEnabled},onchange:r(o=>b("parallaxEnabled",o),"onchange")}} />
    <${P} label="Stärke" ...${{get value(){return e.value.parallaxAmount},get min(){return 0},get max(){return .5},get step(){return .01},onchange:r(o=>b("parallaxAmount",o),"onchange")}} />
  `}r(fn,"$$ParallaxPageRatHtml");function vn(t,a){return gn.call({props:t},t,a)}r(vn,"SourcesBarRatHtml");function gn(t,a){const e=E(()=>$),o=E(()=>ae),i=E(()=>te),n=[["video","Video"],["images","Bilder"]];return d`
    <section.sources-bar class:fullscreen=${()=>o.value==="sources"}>
      <div.sources-lead>
        <div.seg.mode-seg role="tablist">
          ${Y(()=>n,l=>l,l=>d`<button.seg-btn class:active=${()=>e.value.mode===l[0]} role="tab" onclick=${g(()=>b("mode",l[0]))}>${()=>l[1]}</button>`)}
        </div>
        <div.source-actions aria-label="Quellen-Aktionen">
          <button aria-label="Hinzufügen" onclick=${g(De)}><svg-icon icon="add" /></button>
          <button aria-label="Alle entfernen" onclick=${g(Xt)}><svg-icon icon="clear" /></button>
          <button aria-label="Vollbild" onclick=${g(()=>ce("sources"))}><svg-icon icon=${()=>o.value==="sources"?"collapse":"expand"} /></button>
          <button aria-label="Speichern" onclick=${g(Ce)}><svg-icon icon="save" /></button>
        </div>
      </div>
      <div.source-strip ref=${Xe(qe,()=>({move:Lt}))}>
        ${Y(()=>i.value,l=>l,(l,c)=>d`
            <div.tile class=${()=>e.value.mode==="video"?"video-tile":"image-tile"} class:disabled=${()=>!l.enabled} data-index=${()=>c}>
              ${U(()=>e.value.mode==="video",()=>d`<span.tile-label>▶ ${()=>wt(l.path)}</span>`,()=>d`<img src=${()=>Ft(l.path)} alt="" loading="lazy" />`)}
              <button.tile-toggle class:on=${()=>l.enabled} type="button" title="aktiv" onclick=${g(()=>Bt(c))} />
              <button.tile-x type="button" title="entfernen" onclick=${g(()=>Dt(c))}>✕</button>
            </div>
          `)}
        <button.tile.tile-add type="button" title=${()=>e.value.mode==="video"?"videos hinzufügen":"bilder hinzufügen"} onclick=${g(De)}>+</button>
      </div>
    </section>
  `}r(gn,"$$SourcesBarRatHtml");function dn(t,a){return mn.call({props:t},t,a)}r(dn,"DockRatHtml");function mn(t,a){const e=E(()=>Ge),o=E(()=>Re),i=130;let n=L(null),l=L(null);const c=r(()=>Math.round(innerHeight*.78),"max"),h=r(()=>n.value?.firstElementChild?.getBoundingClientRect().width??0,"width");function T(m){o.value===null||!n.value||(n.value.style.transition=m?"transform 0.25s ease":"none",n.value.style.transform=`translateX(${-o.value*h()}px)`)}r(T,"place");let I=null;Z(()=>{const m=o.value;n.value,requestAnimationFrame(()=>T(I!==null&&m!==null)),I=m}),addEventListener("resize",()=>T(!1));let R=null;const p=r(m=>{R={height:l.value.getBoundingClientRect().height,y:m.clientY},m.currentTarget.setPointerCapture(m.pointerId)},"resizeStart"),B=r(m=>{R&&(l.value.style.height=`${Math.max(i,Math.min(c(),R.height+R.y-m.clientY))}px`)},"resizeMove");function y(){R&&(R=null,e.value=Math.round(l.value.getBoundingClientRect().height),T(!1))}r(y,"resizeEnd");const X=ee(()=>e.value&&e.value>i?`height: ${Math.min(e.value,c())}px`:"");let S=null;function V(m){o.value===null||m.target.closest("input, select, textarea, button, a, .tile, .tile-editor")||(S={base:-o.value*h(),decided:!1,horizontal:!1,x:m.clientX,y:m.clientY})}r(V,"swipeStart");function F(m){if(!S)return;const k=m.clientX-S.x,j=m.clientY-S.y;if(!S.decided){if(Math.abs(k)<8&&Math.abs(j)<8)return;S.horizontal=Math.abs(k)>Math.abs(j),S.decided=!0}if(!S.horizontal)return;const H=-(xe.length-1)*h();let _=S.base+k;_>0?_*=.3:_<H&&(_=H+(_-H)*.3),n.value.style.transition="none",n.value.style.transform=`translateX(${_}px)`}r(F,"swipeMove");function W(m){if(!S)return;const{horizontal:k,x:j}=S;if(S=null,!k)return;const H=m.clientX-j,_=h();let q=o.value;H<-_*.25?q=Math.min(xe.length-1,o.value+1):H>_*.25&&(q=Math.max(0,o.value-1)),q===o.value?T(!0):o.value=q}return r(W,"swipeEnd"),d`
    <div.dock>
      <section.tab-panel hidden=${()=>o.value===null} style=${()=>X.value} ref=${Te(l)}>
        <div.panel-handle aria-label="Höhe anpassen" onpointerdown=${g(p)} onpointermove=${g(B)} onpointerup=${g(y)} onpointercancel=${g(y)}><span.grip /></div>
        <div.tab-track ref=${Te(n)} onpointerdown=${g(V)} onpointermove=${g(F)} onpointerup=${g(W)} onpointercancel=${g(W)}>
          <div.tab-page><${tn} /></div>
          <div.tab-page><${on} /></div>
          <div.tab-page><${un} /></div>
          <div.tab-page><${sn} /></div>
        </div>
      </section>
      <nav.tabbar role="tablist">
        ${Y(()=>xe,m=>m,(m,k)=>d`<button.tab-btn class:active=${()=>o.value===k} role="tab" onclick=${g(()=>Wt(k))}>${()=>m[1]}</button>`)}
      </nav>
      <${vn} />
    </div>
  `}r(mn,"$$DockRatHtml");function ge(t,a){return hn.call({props:t},t,a)}r(ge,"SheetRatHtml");function hn(t,a){return d`
    <section.overlay-sheet aria-label=${()=>He(t.title)}>
      <div.overlay-head>
        <span.overlay-title>${()=>t.title}</span>
        <button.tb-btn aria-label="Schließen" onclick=${g(Ve)}><svg-icon icon="close" /></button>
      </div>
      <div.overlay-body>${a}</div>
    </section>
  `}r(hn,"$$SheetRatHtml");function pn(t,a){return bn.call({props:t},t,a)}r(pn,"PresetsSheetRatHtml");function bn(t,a){const e=E(()=>D),o=[["source","Quelle"],["config","Config"],["wallpaper","Wallpaper"]];let i=L({config:"",source:"",wallpaper:""});function n(l){Nt(l,i.value[l]),i.value={...i.value,[l]:""}}return r(n,"store"),d`
    <${ge} title="Presets">
      ${Y(()=>o,l=>l,l=>d`
          <div.preset-group>
            <h3>${()=>l[1]}</h3>
            <div.preset-add>
              <input.preset-name type="text" placeholder="name…" value=${()=>i.value[l[0]]} oninput=${g(c=>i.value={...i.value,[l[0]]:c.currentTarget.value})} />
              <button.btn type="button" onclick=${g(()=>n(l[0]))}>Speichern</button>
            </div>
            <ul.preset-list>
              ${Y(()=>e.value[l[0]],c=>c,(c,h)=>d`
                  <li>
                    <button.preset-load type="button" onclick=${g(()=>Yt(l[0],h))}>${()=>c.name}</button>
                    <button.preset-del type="button" title="löschen" onclick=${g(()=>Gt(l[0],h))}>✕</button>
                  </li>
                `,()=>d`<li.preset-empty>keine</li>`)}
            </ul>
          </div>
        `)}
    </${ge}>
  `}r(bn,"$$PresetsSheetRatHtml");function $n(t,a){return xn.call({props:t},t,a)}r($n,"SettingsSheetRatHtml");function xn(t,a){const e=E(()=>M),o=[["system","System"],["dark","Dunkel"],["light","Hell"]],i=[[.75,"Niedrig (spart Akku)"],[1,"Mittel"],[1.5,"Hoch"]],n=r(l=>`${Math.round(l*100)}%`,"percent");return d`
    <${ge} title="Einstellungen">
      <${N} label="Theme" ...${{get value(){return e.value.mode},get options(){return o},onchange:r(l=>e.value.mode=l,"onchange")}} />
      <label.field>
        <span>Akzentfarbe</span>
        <input type="color" value=${()=>e.value.accent} oninput=${g(l=>e.value.accent=l.currentTarget.value)} />
      </label>
      <${re} label="Abgerundet" ...${{get value(){return e.value.rounded},onchange:r(l=>e.value.rounded=l,"onchange")}} />
      <${P} label="Kachelgröße" unit=" px" ...${{get format(){return String},get value(){return e.value.gridSize},get min(){return 56},get max(){return 140},get step(){return 4},onchange:r(l=>e.value.gridSize=l,"onchange")}} />
      <${P} label="Größe" ...${{get format(){return n},get value(){return e.value.uiScale},get min(){return .8},get max(){return 1.6},get step(){return .05},onchange:r(l=>e.value.uiScale=l,"onchange")}} />
      <${P} label="Abstände" ...${{get format(){return n},get value(){return e.value.spaceScale},get min(){return .5},get max(){return 1.8},get step(){return .05},onchange:r(l=>e.value.spaceScale=l,"onchange")}} />
      <${N} label="Vorschau-Qualität" ...${{get value(){return e.value.quality},get options(){return i},onchange:r(l=>e.value.quality=l,"onchange")}} />
    </${ge}>
  `}r(xn,"$$SettingsSheetRatHtml");function Sn(t,a){return Tn.call({props:t},t,a)}r(Sn,"TopBarRatHtml");function Tn(t,a){return d`
    <header.topbar>
      <div.topbar-left>
        <button.tb-btn aria-label="App-Einstellungen" onclick=${g(()=>ce("settings"))}><svg-icon icon="settings" /></button>
        <span.app-name>Subotnik Wallpapers</span>
      </div>
      <div.topbar-right>
        <button.tb-btn aria-label="Presets" onclick=${g(()=>ce("presets"))}><svg-icon icon="presets" /></button>
        <button.tb-btn aria-label="Quellen" onclick=${g(()=>ce("sources"))}><svg-icon icon="sources" /></button>
        <button.tb-btn aria-label="Als Wallpaper setzen" onclick=${g(_t)}><svg-icon icon="wallpaper" /></button>
        <button.tb-btn.accent aria-label="Speichern" onclick=${g(Ce)}><svg-icon icon="save" /></button>
      </div>
    </header>
  `}r(Tn,"$$TopBarRatHtml");function Pn(t,a){return yn.call({props:t},t,a)}r(Pn,"AppRatHtml");function yn(t,a){const e=E(()=>$),o=E(()=>ze),i=E(()=>M),n=E(()=>ae),l=E(()=>Vt);ht("wp",pt,2),RAT.app.on("error",G.error),RAT.app.hold(Mt());let c=L(null),h=!1;return Z(()=>{!c.value||h||(h=ne.init(c.value),h&&ne.attach(()=>e.value))}),Z(()=>{c.value,e.value,h&&ne.refreshMedia()}),Z(()=>{c.value,ne.setQuality(i.value.quality)}),Z(()=>ne.setPaused(l.value)),d`
    <canvas#preview ref=${Te(c)} />
    ${U(()=>!o.value,()=>d`<p.preview-hint>Vorschau erscheint nach Medienauswahl</p>`)}
    ${U(()=>!n.value,()=>d`<button.preview-pause class:paused=${()=>l.value} aria-label=${()=>He(l.value?"Vorschau fortsetzen":"Vorschau pausieren")} onclick=${g(()=>l.value=!l.value)}><svg-icon icon=${()=>l.value?"play":"pause"} /></button>`)}
    ${U(()=>n.value,()=>d`<div.backdrop onclick=${g(Ve)} />`)}
    <${Sn} />
    ${xt(()=>n.value,["settings","presets"],[()=>d`<${$n} />`,()=>d`<${pn} />`])}
    <${dn} />
  `}r(yn,"$$AppRatHtml");export{Pn as default};

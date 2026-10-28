var ze=Object.defineProperty;var t=(e,n)=>ze(e,"name",{value:n,configurable:!0});import{z as oe,E,G as Fe,H as xe,J as De,K as re,M as W,O as z,P as J,Q as L,T as Q,B as M,V as Z,N as C,l as x,L as Ne,W as Ie,X as fe,Y as $e,Z as be,_ as Y,e as O,h as i,a0 as K,a1 as Me,a2 as je,a3 as qe,w as j,a4 as Ye,a5 as Ke,a6 as ce,a7 as Xe}from"./index-CmynknOt.js";import{p as Ze,a as Ge}from"./keys-CWTtq0D5.js";import"https://esm.sh/jsr/@pulgasari/str";import"https://esm.sh/jsr/@pulgasari/is";import"https://esm.sh/jsr/@pulgasari/logger";function w(e){let n=!1,a;const r=t(()=>(n||(a=e(),n=!0),a),"source");return{get value(){const l=r();return oe(l)?l.value:l},set value(l){const u=r();if(!oe(u))throw new TypeError("[rat] an imported reactive variant changes through its methods, it is not reassigned");u.value=l}}}t(w,"imported");function Ue(e,n,a,r=null){const l=E(()=>xe(e(),n));return Fe(()=>l.value.index,a.map((u,f)=>[f,()=>u(()=>l.value.parts??{})]),r)}t(Ue,"cases");function p(e,{keys:n=null,prevent:a=!1,times:r=0}={}){const l=n?Ze(n):null;let u=r;return function(f){if(!(r&&!u)&&!(l&&!Ge(f,l))){a&&f.preventDefault(),r&&u--;try{const d=(typeof e=="string"?De(e):e).call(this,f);typeof d?.catch=="function"&&d.catch(b=>re(this,b,"handler"))}catch(d){re(this,d,"handler")}}}}t(p,"listener");const se=12,Ve=480,We=t(()=>{try{navigator.vibrate?.(12)}catch{}},"vibrate");function he(e,{hold:n,tap:a}={}){let r=!1,l=!1,u=0,f=0,d=0;const b=t(()=>{clearTimeout(u),u=0},"stop"),k={contextmenu:t(g=>{g.preventDefault(),n?.()},"contextmenu"),click:t(()=>{"ontouchstart"in window||a?.()},"click"),touchcancel:t(()=>{b(),l=!0},"touchcancel"),touchend:t(()=>{b(),!r&&!l&&a?.()},"touchend"),touchmove(g){const c=g.touches[0];(Math.abs(c.clientX-f)>se||Math.abs(c.clientY-d)>se)&&(l=!0,b())},touchstart(g){r=!1,l=!1,{clientX:f,clientY:d}=g.touches[0],b(),u=setTimeout(()=>{l||(r=!0,We(),n?.())},Ve)}};for(const[g,c]of Object.entries(k))e.addEventListener(g,c,{passive:!["contextmenu","touchend"].includes(g)});return()=>{b();for(const[g,c]of Object.entries(k))e.removeEventListener(g,c)}}t(he,"tile");const Je=t(e=>e.scrollTop+e.clientHeight>=e.scrollHeight-2,"atBottom");function ge(e,{accept:n,run:a}){let r=null,l=0,u=0;const f=t(b=>{({clientX:l,clientY:u}=b.touches[0]),r={bottom:Je(e),top:e.scrollTop<=0}},"start"),d=t(b=>{if(!r)return;const k=b.changedTouches[0],g=k.clientX-l,c=k.clientY-u,h=r;r=null,!(Math.abs(c)<Math.abs(g)*1.5)&&(c<0&&!h.bottom||c>0&&!h.top||n(c)&&a())},"end");return e.addEventListener("touchstart",f,{passive:!0}),e.addEventListener("touchend",d),()=>{e.removeEventListener("touchstart",f),e.removeEventListener("touchend",d)}}t(ge,"swipe");const G={cat:"Kategorien",letter:"Anfangsbuchstaben",search:"Suchfeld"},me={barsOrder:Ne(Z("cat","letter","search")).default(["cat","letter","search"]),barsPos:Z("bottom","top"),borderColor:x.default("#ffffff"),borderSize:C.range(0,4).default(0),cellBg:x.default("#ffffff"),cellBgAlpha:C.range(0,1).default(.05),cellPad:C.range(0,28).default(12),cols:C.range(3,10).default(4),customCss:x.default(""),cutLabel:M.default(!0),gap:C.range(0,28).default(8),iconColor:x.default("#e6e6e6"),letterTwoRows:M,pageBg:x.default("#0d0d10"),pageBgAlpha:C.range(0,1).default(1),shape:Z("squircle","circle","square"),showLabel:M.default(!0),uppercase:M},$=Q("look",Ie(me).create());let T=Q("home",null),y=Q("folders",[]);function Qe(){let e=null;try{e=JSON.parse(localStorage.getItem("launcher")??"null")}catch{}e&&($.assign(Object.fromEntries(Object.keys(me).filter(n=>n in e).map(n=>[n,e[n]]))),Array.isArray(e.home)&&(T.value=e.home),Array.isArray(e.folders)&&(y.value=e.folders),localStorage.removeItem("launcher"))}t(Qe,"adopt");Qe();const we=E(()=>[...new Set([...$.barsOrder].filter(e=>G[e]))].concat(Object.keys(G).filter(e=>![...$.barsOrder].includes(e))));let H=L([]);const ye=E(()=>new Map(H.value.map(e=>[e.packageName,e]))),_e=["phone","message","browser","camera","mail","photos"];async function et(){try{H.value=await W.apps()}catch{H.value=[],z.error("konnte apps nicht laden")}if(T.value)return;const e=[];for(const n of _e){const a=H.value.find(r=>J(r)===n&&!e.includes(r.packageName));a&&e.push(a.packageName)}T.value=e}t(et,"load");async function _(e){try{await W.launch(e)}catch{z.error("konnte app nicht starten")}D()}t(_,"launch");const tt=t(e=>y.value.find(n=>n.apps.includes(e))??null,"folderOf"),ke=t(e=>(T.value??[]).includes(e),"isPinned"),ee=t(e=>e.apps.map(n=>ye.value.get(n)).filter(Boolean),"appsOf"),nt=E(()=>(()=>{const e=new Set(y.value.flatMap(n=>n.apps));return(T.value??[]).filter(n=>!e.has(n)).map(n=>ye.value.get(n)).filter(Boolean)})()),U=t(e=>{ke(e)||(T.value=[...T.value??[],e])},"pin"),Ae=t(e=>{T.value=(T.value??[]).filter(n=>n!==e)},"unpin"),at=t(()=>`f${Math.random().toString(36).slice(2,9)}`,"id");function Se(e){const n={apps:[],id:at(),name:e||"Ordner"};return y.value=[...y.value,n],n}t(Se,"createFolder");const Oe=t((e,n)=>{y.value=y.value.map(a=>a.id===e?{...a,name:n||a.name}:a)},"renameFolder");function Ee(e){const n=y.value.find(a=>a.id===e);for(const a of n?.apps??[])U(a);y.value=y.value.filter(a=>a.id!==e)}t(Ee,"deleteFolder");const V=t(e=>{y.value=y.value.map(n=>({...n,apps:n.apps.filter(a=>a!==e)}))},"leaveFolder");function ie(e,n){V(e),y.value=y.value.map(a=>a.id===n?{...a,apps:[...a.apps,e]}:a),Ae(e)}t(ie,"moveToFolder");let te=L(!1),q=L(null),P=L(null),ne=L("");const lt=t((e,n)=>!n||fe(e.label).includes(n)||e.packageName.toLowerCase().includes(n),"matches"),Re=E(()=>(()=>{const e=fe(ne.value).trim();return H.value.filter(n=>(!q.value||$e(n)===q.value)&&lt(n,e))})()),Te=E(()=>new Set(Re.value.map(be))),ot=E(()=>Re.value.filter(e=>!P.value||!Te.value.has(P.value)||be(e)===P.value));function ue(){q.value=null,P.value=null,ne.value="",te.value=!0}t(ue,"openDrawer");function D(){document.activeElement?.blur?.(),te.value=!1}t(D,"closeDrawer");function de(e,n){P.value=n&&P.value===e?null:e}t(de,"setLetter");let F=L(null),N=L(null);const Le=t(e=>{N.value=e,F.value="actions"},"openActions"),rt=t(()=>{F.value="settings"},"openSettings");function He(e){N.value=e.id,F.value="folder"}t(He,"openFolder");const B=t(()=>{F.value=null,N.value=null},"closeSheet");function pe(){F.value?B():D()}t(pe,"back");function ct(){B(),D()}t(ct,"home");const ve=t((e,n)=>{const a=/^#?([0-9a-f]{6})$/i.exec(String(e??"").trim());if(!a)return e;const r=parseInt(a[1],16);return`rgba(${r>>16&255}, ${r>>8&255}, ${r&255}, ${n})`},"rgba"),st={circle:"50%",square:"14px",squircle:"32%"};Y(()=>{const{style:e,classList:n}=document.body;e.setProperty("--cols",$.cols),e.setProperty("--glyph-color",$.iconColor),e.setProperty("--gap",`${$.gap}px`),e.setProperty("--cell-pad",`${$.cellPad}px`),e.setProperty("--cell-radius",st[$.shape]),e.setProperty("--cell-border",`${$.borderSize}px`),e.setProperty("--cell-border-color",$.borderColor),e.setProperty("--cell-bg",ve($.cellBg,$.cellBgAlpha)),e.setProperty("--page-bg",ve($.pageBg,$.pageBgAlpha)),n.toggle("no-label",!$.showLabel),n.toggle("uppercase",$.uppercase),n.toggle("multiline",!$.cutLabel),n.toggle("drawer-bars-top",$.barsPos==="top"),n.toggle("letters-two-rows",$.letterTwoRows)});const it=document.head.appendChild(document.createElement("style"));Y(()=>{it.textContent=$.customCss});Y(()=>W.showWallpaper($.pageBgAlpha<1));function ut(e,n){return dt.call({props:e},e,n)}t(ut,"ActionSheetRatHtml");function dt(e,n){const a=w(()=>y),r=w(()=>N),{dialogs:l}=RAT.app,u=t(c=>l.prompt({cancel:"Abbrechen",message:"Ordnername",ok:"OK",title:"Ordner",value:c}),"ask");function f(c){const h=c.packageName,R=tt(h),s=ke(h);return[{icon:"open",label:"Öffnen",run:t(()=>_(h),"run")},!R&&!s&&{icon:"pin",label:"Zum Homescreen hinzufügen",run:t(()=>{U(h),z("zum homescreen hinzugefügt")},"run")},...a.value.filter(m=>m.id!==R?.id).map(m=>({icon:"folder",label:`In "${m.name}" verschieben`,run:t(()=>{ie(h,m.id),z(`in ${m.name} verschoben`)},"run")})),{icon:"add",label:"Neuer Ordner mit App",run:t(async()=>{const m=await u("Ordner");m!=null&&ie(h,Se(m.trim()||"Ordner").id)},"run")},R&&{icon:"back",label:`Aus "${R.name}" entfernen`,run:t(()=>{V(h),U(h)},"run")},(R||s)&&{danger:!0,icon:"close",label:"Vom Homescreen entfernen",run:t(()=>{V(h),Ae(h),z("vom homescreen entfernt")},"run")}].filter(Boolean)}t(f,"appActions");const d=t(c=>[{icon:"open",label:"Öffnen",run:t(()=>He(c),"run")},{icon:"edit",label:"Umbenennen",run:t(async()=>{const h=await u(c.name);h!=null&&Oe(c.id,h.trim())},"run")},{danger:!0,icon:"trash",label:"Ordner löschen",run:t(()=>Ee(c.id),"run")}],"folderActions"),b=E(()=>r.value?.app?.label??r.value?.folder?.name??""),k=E(()=>r.value?.app?f(r.value.app):r.value?.folder?d(r.value.folder):[]);function g(c){B(),c.run()}return t(g,"run"),i`
    <section.action-sheet aria-label="Aktionen">
      <div.sheet-title>${()=>b.value}</div>
      <div.sheet-actions>
        ${O(()=>k.value,c=>c,c=>i`<button.sheet-btn class:danger=${()=>c.danger} onclick=${p(()=>g(c))}><svg-icon icon=${()=>c.icon} /><span>${()=>c.label}</span></button>`)}
      </div>
      <button.sheet-cancel onclick=${p(B)}>Abbrechen</button>
    </section>
  `}t(dt,"$$ActionSheetRatHtml");function ae(e,n){return pt.call({props:e},e,n)}t(ae,"AppTileRatHtml");function pt(e,n){const a=e.app;return i`
    <button.tile ref=${K(he,()=>({hold:t(()=>Le({app:a}),"hold"),tap:t(()=>_(a.packageName),"tap")}))}>
      <span.tile-icon><svg-icon icon=${()=>J(a)} /></span>
      <span.tile-label>${()=>a.label}</span>
    </button>
  `}t(pt,"$$AppTileRatHtml");function vt(e,n){return ft.call({props:e},e,n)}t(vt,"DrawerRatHtml");function ft(e,n){const a=w(()=>H),r=w(()=>we),l=w(()=>q),u=w(()=>ot),f=w(()=>P),d=w(()=>Te),b=w(()=>ne);let k=L(null);const g=E(()=>(()=>{const s=new Set(a.value.map($e));return[{id:null,label:"Alle"},...Me.filter(([m])=>s.has(m)).map(([m,S])=>({id:m,label:S}))]})()),c=t(s=>r.value.indexOf(s),"orderOf");Y(()=>{l.value,f.value,b.value,k.value&&(k.value.scrollTop=0)});function h(s){const m=s.touches[0],S=document.elementFromPoint(m.clientX,m.clientY);S?.classList?.contains("letter")&&!S.disabled&&de(S.dataset.letter,!1),s.preventDefault()}t(h,"scrub");function R(s){if(s.key!=="Enter")return;const m=u.value[0];m&&_(m.packageName)}return t(R,"enter"),i`
    <section.drawer aria-label="Alle Apps">
      <button.drawer-handle aria-label="Schließen" onclick=${p(D)}><span /></button>
      <div.drawer-scroll ref=${je(k)} ref=${K(ge,()=>({accept:t(s=>s>90,"accept"),run:D}))}>
        <div.grid aria-label="Apps">
          ${O(()=>u.value,s=>s,s=>i`<${ae} ...${{get app(){return s}}} />`,()=>i`<p.empty>keine treffer</p>`)}
        </div>
      </div>
      <div.drawer-bars>
        <div.cat-bar role="group" aria-label="Kategorien" style=${()=>`order: ${c("cat")}`}>
          ${O(()=>g.value,s=>s,s=>i`<button.cat-chip class:active=${()=>l.value===s.id} onclick=${p(()=>l.value=s.id)}>${()=>s.label}</button>`)}
        </div>
        <div.letter-bar role="group" aria-label="Anfangsbuchstaben" style=${()=>`order: ${c("letter")}`} ontouchmove=${p(h)}>
          ${O(()=>qe,s=>s,s=>i`<button.letter class:active=${()=>f.value===s} data-letter=${()=>s} disabled=${()=>!d.value.has(s)} onclick=${p(()=>de(s,!0))}>${()=>s}</button>`)}
        </div>
        <div.search-bar style=${()=>`order: ${c("search")}`}>
          <input type="search" placeholder="Apps suchen" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="go" value=${()=>b.value} oninput=${p(s=>b.value=s.currentTarget.value)} onkeydown=${p(R)} />
          ${j(()=>b.value,()=>i`<button.icon-btn aria-label="Suche leeren" onclick=${p(()=>b.value="")}><svg-icon icon="close" /></button>`)}
        </div>
      </div>
    </section>
  `}t(ft,"$$DrawerRatHtml");function $t(e,n){return bt.call({props:e},e,n)}t($t,"FolderSheetRatHtml");function bt(e,n){const a=w(()=>y),r=w(()=>N),l=E(()=>a.value.find(u=>u.id===r.value));return i`
    <section.overlay-sheet aria-label="Ordner">
      <div.overlay-head>
        <span.overlay-title>${()=>l.value?.name??"Ordner"}</span>
        <button.icon-btn aria-label="Schließen" onclick=${p(B)}><svg-icon icon="close" /></button>
      </div>
      <div.grid.grid-in-folder>
        ${O(()=>l.value?ee(l.value):[],u=>u,u=>i`<${ae} ...${{get app(){return u}}} />`,()=>i`<p.empty>ordner ist leer</p>`)}
      </div>
    </section>
  `}t(bt,"$$FolderSheetRatHtml");function ht(e,n){return gt.call({props:e},e,n)}t(ht,"FolderTileRatHtml");function gt(e,n){const a=e.folder,r=E(()=>ee(a).slice(0,4));return i`
    <button.tile ref=${K(he,()=>({hold:t(()=>Le({folder:a}),"hold"),tap:t(()=>He(a),"tap")}))}>
      <span.tile-icon.folder-icon>
        ${O(()=>r.value,l=>l,l=>i`<span.mini><svg-icon icon=${()=>J(l)} /></span>`,()=>i`<svg-icon.whole icon="folder" />`)}
      </span>
      <span.tile-label>${()=>a.name}</span>
    </button>
  `}t(gt,"$$FolderTileRatHtml");function mt(e,n){return wt.call({props:e},e,n)}t(mt,"SettingsSheetRatHtml");function wt(e,n){const a=w(()=>we),r=w(()=>y),l=w(()=>$),{dialogs:u}=RAT.app,f=["#e6e6e6","#111111","#4f8cff","#22c55e","#f97316","#ec4899"],d=[["circle","Kreis"],["squircle","Squircle"],["square","Eckig"]],b=[["top","Oben"],["bottom","Unten"]],k=t(o=>v=>{l.value[o]=Number(v.currentTarget.value)},"number"),g=t(o=>v=>{l.value[o]=v.currentTarget.value},"text"),c=t(o=>v=>{l.value[o]=v.currentTarget.checked},"check");function h(o,v){const A=[...a.value];[A[o],A[o+v]]=[A[o+v],A[o]],l.value.barsOrder=A}t(h,"move");const R=t(o=>u.prompt({cancel:"Abbrechen",message:"Ordnername",ok:"OK",title:"Ordner",value:o}),"ask");async function s(){const o=await R("Ordner");o!=null&&Se(o.trim()||"Ordner")}t(s,"add");async function m(o){const v=await R(o.name);v!=null&&Oe(o.id,v.trim())}t(m,"rename");function S(o,v,A,Pe,Be,Ce){return i`
      <div.field.range-field>
        <label>${()=>v} <b>${()=>l.value[o]}${()=>Ce}</b></label>
        <input type="range" min=${()=>A} max=${()=>Pe} step=${()=>Be} value=${()=>l.value[o]} oninput=${p(k(o))} />
      </div>
    `}t(S,"range");function X(o,v){return i`
      <div.field.row-field>
        <label>${()=>v}</label>
        <input type="color" value=${()=>l.value[o]} oninput=${p(g(o))} />
      </div>
    `}t(X,"color");function I(o,v){return i`
      <label.switch-row>
        <span>${()=>v}</span>
        <input type="checkbox" checked=${()=>l.value[o]} onchange=${p(c(o))} />
      </label>
    `}t(I,"toggle");function le(o,v){return i`
      <div.seg role="group">
        ${O(()=>v,A=>A,A=>i`<button.seg-btn class:active=${()=>l.value[o]===A[0]} onclick=${p(()=>l.value[o]=A[0])}>${()=>A[1]}</button>`)}
      </div>
    `}return t(le,"segments"),i`
    <section.overlay-sheet.settings aria-label="Einstellungen">
      <div.overlay-head>
        <span.overlay-title>Einstellungen</span>
        <button.icon-btn aria-label="Schließen" onclick=${p(B)}><svg-icon icon="close" /></button>
      </div>
      <h3.group-title>Raster</h3>
      ${()=>S("cols","Spalten",3,10,1,"")}
      ${()=>S("gap","Abstand",0,28,1,"px")}
      <h3.group-title>Zelle</h3>
      ${()=>S("cellPad","Innenabstand",0,28,1,"px")}
      <div.field><label>Form</label>${()=>le("shape",d)}</div>
      <div.field>
        <label>Icon-Farbe</label>
        <div.color-row>
          <input type="color" value=${()=>l.value.iconColor} oninput=${p(g("iconColor"))} />
          <div.color-presets>
            ${O(()=>f,o=>o,o=>i`<button.swatch class:active=${()=>o===l.value.iconColor.toLowerCase()} style=${()=>`background: ${o}`} aria-label=${()=>Ye(o)} onclick=${p(()=>l.value.iconColor=o)} />`)}
          </div>
        </div>
      </div>
      ${()=>S("borderSize","Rahmenstärke",0,4,1,"px")}
      ${()=>X("borderColor","Rahmenfarbe")}
      ${()=>X("cellBg","Zell-Hintergrund")}
      ${()=>S("cellBgAlpha","Zell-Transparenz",0,1,.05,"")}
      <h3.group-title>Beschriftung</h3>
      ${()=>I("showLabel","App-Name zeigen")}
      ${()=>I("uppercase","Großbuchstaben")}
      ${()=>I("cutLabel","Einzeilig kürzen (aus = mehrzeilig)")}
      <h3.group-title>Hintergrund</h3>
      ${()=>X("pageBg","Farbe")}
      ${()=>S("pageBgAlpha","Deckkraft",0,1,.05,"")}
      <p.hint>Deckkraft &lt; 1 lässt das System-Wallpaper durchscheinen.</p>
      <h3.group-title>App-Drawer</h3>
      <div.field><label>Position der Leisten</label>${()=>le("barsPos",b)}</div>
      <div.field>
        <label>Reihenfolge der Leisten (von oben nach unten)</label>
        <ul.order-list>
          ${O(()=>a.value,o=>o,(o,v)=>i`
              <li.order-row>
                <span>${()=>G[o]}</span>
                <span.row-actions>
                  <button.icon-btn aria-label="Nach oben" disabled=${()=>v===0} onclick=${p(()=>h(v,-1))}><svg-icon icon="up" /></button>
                  <button.icon-btn aria-label="Nach unten" disabled=${()=>v===a.value.length-1} onclick=${p(()=>h(v,1))}><svg-icon icon="down" /></button>
                </span>
              </li>
            `)}
        </ul>
      </div>
      ${()=>I("letterTwoRows","Anfangsbuchstaben zweizeilig")}
      <h3.group-title>Eigenes CSS</h3>
      <textarea.css-area spellcheck="false" placeholder=${()=>".tile-label { letter-spacing: .04em }"} value=${()=>l.value.customCss} oninput=${p(g("customCss"))} />
      <h3.group-title>Ordner</h3>
      <div.field>
        <div.field-head>
          <label>Ordner</label>
          <button.chip onclick=${p(s)}><svg-icon icon="add" /> Ordner erstellen</button>
        </div>
        <ul.folder-list>
          ${O(()=>r.value,o=>o,o=>i`
              <li.folder-row>
                <span.folder-row-name>
                  <svg-icon icon="folder" />
                  <span>${()=>o.name}</span>
                  <em>${()=>ee(o).length}</em>
                </span>
                <span.row-actions>
                  <button.icon-btn aria-label="Umbenennen" onclick=${p(()=>m(o))}><svg-icon icon="edit" /></button>
                  <button.icon-btn.danger aria-label="Löschen" onclick=${p(()=>Ee(o.id))}><svg-icon icon="trash" /></button>
                </span>
              </li>
            `,()=>i`<li.muted>noch keine ordner</li>`)}
        </ul>
      </div>
    </section>
  `}t(wt,"$$SettingsSheetRatHtml");function Tt(e,n){return yt.call({props:e},e,n)}t(Tt,"AppRatHtml");function yt(e,n){const a=w(()=>te),r=w(()=>y),l=w(()=>nt),u=w(()=>H),f=w(()=>F);return Ke("sub",Xe),RAT.app.on("error",z.error),RAT.app.hold(et()),ce("launcherback",pe),ce("launcherhome",ct),addEventListener("keydown",d=>{d.key==="Escape"&&pe()}),i`
    <main.home ref=${K(ge,()=>({accept:t(d=>d<-70,"accept"),run:ue}))}>
      <div.grid aria-label="Homescreen">
        ${O(()=>r.value,d=>d,d=>i`<${ht} ...${{get folder(){return d}}} />`)}
        ${O(()=>l.value,d=>d,d=>i`<${ae} ...${{get app(){return d}}} />`)}
        ${j(()=>!r.value.length&&!l.value.length,()=>i`<p.empty>${()=>u.value.length?"homescreen ist leer. im app-drawer eine app lange drücken und anheften.":"keine apps gefunden"}</p>`)}
      </div>
    </main>
    <button.fab.fab-drawer aria-label="Alle Apps" onclick=${p(ue)}><svg-icon icon="grid" /></button>
    <button.fab aria-label="Einstellungen" onclick=${p(rt)}><svg-icon icon="settings" /></button>
    ${j(()=>a.value,()=>i`<${vt} />`)}
    ${j(()=>f.value==="actions"||f.value==="folder",()=>i`<div.backdrop onclick=${p(B)} />`)}
    ${Ue(()=>f.value,["actions","folder","settings"],[()=>i`<${ut} />`,()=>i`<${$t} />`,()=>i`<${mt} />`])}
  `}t(yt,"$$AppRatHtml");export{Tt as default};

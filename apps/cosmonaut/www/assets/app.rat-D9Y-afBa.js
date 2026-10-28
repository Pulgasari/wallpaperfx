var He=Object.defineProperty;var n=(e,t)=>He(e,"name",{value:t,configurable:!0});import{z as fe,E as L,G as Le,H as Me,J as Ne,K as $e,M as y,O as be,l as oe,N as me,B as Be,P as G,Q as Ue,T as ae,V as Fe,W as ge,e as x,X as Y,h as u,Y as Ge,w as P,Z as Ie,_ as Oe,a0 as je}from"./index-DJO6R6y7.js";import{p as ze,a as qe}from"./keys-CWTtq0D5.js";import"https://esm.sh/jsr/@pulgasari/str";import"https://esm.sh/jsr/@pulgasari/is";import"https://esm.sh/jsr/@pulgasari/logger";function k(e){let t=!1,l;const o=n(()=>(t||(l=e(),t=!0),l),"source");return{get value(){const a=o();return fe(a)?a.value:a},set value(a){const c=o();if(!fe(c))throw new TypeError("[rat] an imported reactive variant changes through its methods, it is not reassigned");c.value=a}}}n(k,"imported");function we(e,t,l,o=null){const a=L(()=>Me(e(),t));return Le(()=>a.value.index,l.map((c,i)=>[i,()=>c(()=>a.value.parts??{})]),o)}n(we,"cases");function r(e,{keys:t=null,prevent:l=!1,times:o=0}={}){const a=t?ze(t):null;let c=o;return function(i){if(!(o&&!c)&&!(a&&!qe(i,a))){l&&i.preventDefault(),o&&c--;try{const p=(typeof e=="string"?Ne(e):e).call(this,i);typeof p?.catch=="function"&&p.catch($=>$e(this,$,"handler"))}catch(p){$e(this,p,"handler")}}}}n(r,"listener");globalThis.Capacitor?.isNativePlatform?.();const xe=n((e,t={})=>globalThis.Capacitor?.Plugins?.[e]??t,"plugin$1"),I=n(e=>e+Math.random().toString(36).slice(2,8),"uid"),S=n(e=>{try{return new URL(e).hostname.replace(/^www\./,"")}catch{return e||""}},"domainOf"),K=n(e=>(String(e||"")[0]||"?").toUpperCase(),"initial");function Te(e,t){const l=new Map;for(const o of e){const a=t(o);l.has(a)||l.set(a,[]),l.get(a).push(o)}return l}n(Te,"bucketsBy");function Je(){const e=new Map;let t=[{id:"t1",url:"https://duckduckgo.com/",title:"DuckDuckGo",loading:!1,progress:100,canGoBack:!1},{id:"t2",url:"https://news.ycombinator.com/",title:"Hacker News",loading:!1,progress:100,canGoBack:!0},{id:"t3",url:"https://developer.mozilla.org/",title:"MDN Web Docs",loading:!1,progress:100,canGoBack:!1}],l="t2",o=!1,a=t.length;const c=n(()=>structuredClone({tabs:t,activeId:l,expanded:o}),"state"),i=n((v,s)=>(e.get(v)??[]).forEach(b=>b(s)),"emit"),p=n(()=>(i("state",c()),c()),"push"),$=n(v=>/^[a-z]+:\/\//i.test(v)?v:v.includes(".")&&!v.includes(" ")?"https://"+v:"https://duckduckgo.com/?q="+encodeURIComponent(v),"normalize"),d=n(async()=>{},"noop");return{ready:n(async()=>c(),"ready"),getState:n(async()=>c(),"getState"),async navigate({url:v}){const s=t.find(b=>b.id===l)??t[0];return s.url=$(v),s.title=S(s.url),o=!1,p()},async newTab({url:v}={}){const s="t"+ ++a;return t.push({id:s,url:v||"https://duckduckgo.com/",title:"New tab",loading:!1,progress:100,canGoBack:!1}),l=s,p()},async closeTab({id:v}){return t=t.filter(s=>s.id!==v),l===v&&(l=t.at(-1)?.id??""),p()},async activateTab({id:v}){return l=v,p()},async setChromeExpanded({expanded:v}){return o=v,p()},goBack:n(async()=>c(),"goBack"),goForward:n(async()=>c(),"goForward"),reload:n(async()=>c(),"reload"),hardReload:n(async()=>c(),"hardReload"),setDockPosition:d,setStripHeight:d,findInPage:d,findNext:d,clearFind:d,toggleDevtools:d,setUserscripts:d,addListener(v,s){return e.set(v,[...e.get(v)??[],s]),{remove:n(()=>e.set(v,e.get(v).filter(b=>b!==s)),"remove")}}}}n(Je,"createMock");const ue=xe("Browser",null)??Je(),he=xe("Filesystem",null);async function C(e,t={}){try{return await ue[e](t)}catch{return}}n(C,"call");const We={tl:{describe:n((e,t)=>`translate → ${t||"en"}`,"describe"),url:n((e,t)=>"https://translate.google.com/?sl=auto&tl="+encodeURIComponent(t||"en")+"&text="+encodeURIComponent(e)+"&op=translate","url")}},Xe=/^([a-z]+):(\S*)\s+(\S.*)$/i;function se(e){const t=Xe.exec(e.trim()),l=t&&We[t[1].toLowerCase()];return l?{arg:t[2],command:l,name:t[1].toLowerCase(),text:t[3]}:null}n(se,"parseCommand");const Ye=n(({arg:e,command:t,text:l})=>t.url(l,e),"commandUrl"),Ke=n(({arg:e,command:t,text:l})=>t.describe(l,e),"describeCommand"),ie=n(e=>/^[a-z][a-z0-9+.-]*:\/\//i.test(e)||e.includes(".")&&!e.includes(" "),"isUrlLike"),_e=n((e,t)=>e.url.includes("%s")?e.url.replaceAll("%s",encodeURIComponent(t)):e.url+encodeURIComponent(t),"searchUrl");function Qe(e,{engine:t,fallback:l}){const o=(e||"").trim();if(!o)return null;const a=!t&&se(o);if(a)return Ye(a);const c=t??(ie(o)?null:l);return c?_e(c,o):o}n(Qe,"target");let O=y({activeId:"",expanded:!1,tabs:[]});const le=L(()=>O.value.tabs.find(e=>e.id===O.value.activeId)??null);ue.addListener("state",e=>{O.value={...O.value,...e},!e.expanded&&j.value&&(j.value=null)});async function Ve(){const e=await C("ready");e&&(O.value={...O.value,...e})}n(Ve,"start");const re=["tabs","marks","find","userscripts","devtools","settings"],Ze=[{icon:"",id:"ddg",name:"DuckDuckGo",url:"https://duckduckgo.com/?q=%s"},{icon:"",id:"google",name:"Google",url:"https://www.google.com/search?q=%s"},{icon:"",id:"wikipedia",name:"Wikipedia",url:"https://en.wikipedia.org/w/index.php?search=%s"}],Se={accent:oe.default("#4f8cff"),bg:oe.default("#0c0d10"),blur:Be.default(!0),dockGap:me.range(4,28).default(12),dockPos:be("bottom","top"),dockSize:me.range(36,60).default(46),fg:oe.default("#edeef0"),loaderPos:be("bottom","top")},B=G("settings",Ue(Se).create());let ce=G("dock",re.map(e=>({id:e,on:e!=="devtools"}))),T=G("bookmarks",[]),q=G("folders",[]),te=G("groups",[]),ne=G("tabGroups",{}),F=G("scripts",[]),H=G("engines",Ze),J=G("defaultEngine","ddg");function et(){let e=null;try{e=JSON.parse(localStorage.getItem("browser")??"null")}catch{}if(!e)return;const t=n(a=>Array.isArray(a)?a:[],"list"),{dock:l,...o}=e.settings??{};B.assign(Object.fromEntries(Object.keys(Se).filter(a=>a in o).map(a=>[a,o[a]]))),Array.isArray(l)&&(ce.value=l),T.value=t(e.bookmarks),q.value=t(e.bookmarkFolders),te.value=t(e.groups),ne.value=e.tabGroups&&typeof e.tabGroups=="object"?e.tabGroups:{},F.value=t(e.userscripts),t(e.engines).length&&(H.value=e.engines),e.defaultEngine&&(J.value=e.defaultEngine),localStorage.removeItem("browser")}n(et,"adopt");et();const Ce=L(()=>(()=>{const e=new Set;return[...ce.value.filter(l=>l&&re.includes(l.id)&&!e.has(l.id)&&e.add(l.id)),...re.filter(l=>!e.has(l)).map(l=>({id:l,on:l!=="devtools"}))]})()),tt=L(()=>H.value.find(e=>e.id===J.value)??H.value[0]);let j=y(null),Pe=y(null);async function U(e){j.value=e,await C("setChromeExpanded",{expanded:!0})}n(U,"open");async function M(){j.value=null,await C("setChromeExpanded",{expanded:!1})}n(M,"close");function nt(e,t){Pe.value={anchor:t,items:e},U("menu")}n(nt,"openMenu");let ke=null;ae(()=>{ke==="find"&&j.value!=="find"&&C("clearFind"),ke=j.value});const z={devtools:{icon:"console",label:"Dev tools",run:n(()=>{C("toggleDevtools"),M()},"run")},find:{icon:"search",label:"Find in page",run:n(()=>U("find"),"run")},marks:{icon:"book",label:"Bookmarks",run:n(()=>U("marks"),"run")},settings:{icon:"gear",label:"Settings",run:n(()=>U("settings"),"run")},tabs:{icon:"tabs",label:"Tabs",run:n(()=>U("tabs"),"run")},userscripts:{icon:"code",label:"Userscripts",run:n(()=>U("scripts"),"run")}};function X(e,t){const l=t?H.value.find(a=>a.id===t):null,o=Qe(e,{engine:l,fallback:tt.value});o&&(C("navigate",{url:o}),M())}n(X,"go");async function at(){await C("newTab"),U("dash")}n(at,"newTab");const de=n(e=>T.value.some(t=>t.url===e),"isBookmarked"),Re=n(e=>({id:I("b"),title:e.title||S(e.url),url:e.url}),"markOf");function lt(){const e=le.value;e?.url&&!de(e.url)&&(T.value=[Re(e),...T.value])}n(lt,"addCurrent");function ot(){const e=le.value;e?.url&&(T.value=de(e.url)?T.value.filter(t=>t.url!==e.url):[Re(e),...T.value])}n(ot,"toggleBookmark");const st=n(e=>{T.value=T.value.some(t=>t.id===e.id)?T.value.map(t=>t.id===e.id?e:t):[...T.value,e]},"saveMark"),it=n(e=>{T.value=T.value.filter(t=>t.id!==e)},"deleteMark"),rt=n(e=>{q.value=[...q.value,{id:I("f"),name:e.trim()||"Folder"}]},"addFolder");function ut({bookmarks:e,folders:t}){const l=new Set(T.value.map(a=>a.url)),o=e.filter(a=>a.url&&!l.has(a.url)&&l.add(a.url));return q.value=[...q.value,...t],T.value=[...T.value,...o],o.length}n(ut,"importMarks");function ct(e,t){const{[e]:l,...o}=ne.value;ne.value=t?{...o,[e]:t}:o}n(ct,"setGroup");const dt=n(e=>{te.value=[...te.value,{id:I("g"),name:e.trim()||"Group"}]},"addGroup"),pt=n(e=>e?.trim()?`
;(() => { const style = document.createElement('style'); style.textContent = ${JSON.stringify(e)}; (document.head || document.documentElement).append(style); })();`:"","styleSnippet");ae(()=>C("setUserscripts",{scripts:F.value.map(({code:e,css:t,enabled:l,matches:o,name:a})=>({code:(e||"")+pt(t),enabled:l,matches:[...o??[]],name:a}))}));const ye=n(e=>{F.value=F.value.some(t=>t.id===e.id)?F.value.map(t=>t.id===e.id?e:t):[...F.value,e]},"saveScript"),vt=n(e=>{F.value=F.value.filter(t=>t.id!==e)},"deleteScript"),ft=n(e=>{H.value=H.value.some(t=>t.id===e.id)?H.value.map(t=>t.id===e.id?e:t):[...H.value,e]},"saveEngine");function $t(e){H.value=H.value.filter(t=>t.id!==e),J.value===e&&(J.value=H.value[0]?.id)}n($t,"deleteEngine");ae(()=>{const e=document.body.style;e.setProperty("--color-bg",B.bg),e.setProperty("--color-fg",B.fg),e.setProperty("--color-ink",B.accent),document.documentElement.style.setProperty("--dock-size",`${B.dockSize}px`),document.documentElement.style.setProperty("--dock-gap",`${B.dockGap}px`),document.body.classList.toggle("no-blur",!B.blur),document.body.classList.toggle("loader-top",B.loaderPos==="top"),document.body.classList.toggle("dock-top",B.dockPos==="top")});ae(()=>C("setDockPosition",{position:B.dockPos}));const Z=n(e=>(t,l)=>Fe.notify(t,{...l,type:e}),"notify"),bt=Object.assign(Z("info"),{error:Z("error"),info:Z("info"),success:Z("success")}),mt=450;function gt(e,t){let l=!1,o=null,a=0,c=0;const i=n(()=>{clearTimeout(o),o=null},"clear"),p={pointercancel:i,pointerup:i,click($){l&&($.stopPropagation(),$.preventDefault(),l=!1)},contextmenu($){$.preventDefault(),i(),t($)},pointerdown($){l=!1,{clientX:a,clientY:c}=$,i(),o=setTimeout(()=>{l=!0,t($)},mt)},pointermove($){o&&Math.hypot($.clientX-a,$.clientY-c)>10&&i()}};for(const[$,d]of Object.entries(p))e.addEventListener($,d,$==="click");return()=>{i();for(const[$,d]of Object.entries(p))e.removeEventListener($,d,$==="click")}}n(gt,"hold");function ht(e,t){return kt.call({props:e},e,t)}n(ht,"BarRatHtml");function kt(e,t){const l=k(()=>le),o=k(()=>Ce);let a=y(null);const c=L(()=>o.value.filter(s=>s.on).map(s=>s.id)),i=L(()=>Math.ceil(c.value.length/2)),p=L(()=>!!(l.value?.loading&&l.value.progress<100));function $(s){const b=new ResizeObserver(()=>{const g=Math.ceil(s.getBoundingClientRect().height);document.documentElement.style.setProperty("--strip",`${g}px`),C("setStripHeight",{height:g})});return b.observe(s,{box:"border-box"}),()=>b.disconnect()}n($,"strip");function d(){const s=l.value;nt([{icon:"book",label:s&&de(s.url)?"Remove bookmark":"Add bookmark",run:ot},{separator:!0},{icon:"reload",label:"Reload",run:n(()=>C("reload"),"run")},{icon:"bolt",label:"Hard reload",run:n(()=>C("hardReload"),"run")},{separator:!0},{danger:!0,icon:"x",label:"Close tab",run:n(()=>s&&C("closeTab",{id:s.id}),"run")}],a.value)}n(d,"pillMenu");function v(s){return u`<button.trig title=${()=>z[s].label} aria-label=${()=>Ge(z[s].label)} onclick=${r(z[s].run)}><svg-icon icon=${()=>z[s].icon} /></button>`}return n(v,"button"),u`
    <div.prog hidden=${()=>!p.value}><span style=${()=>`width: ${p.value?l.value.progress:0}%`} /></div>
    <div.bar ref=${ge($)}>
      <div.dock-group>
        ${x(()=>c.value.slice(0,i.value),s=>s,s=>u`${()=>v(s)}`)}
      </div>
      <button.pill ref=${Y(a)} onclick=${r(()=>U("url"))} ref=${ge(gt,()=>d)}><span.pill-text>${()=>l.value?.url?S(l.value.url):"Search or URL"}</span></button>
      <div.dock-group>
        ${x(()=>c.value.slice(i.value),s=>s,s=>u`${()=>v(s)}`)}
      </div>
    </div>
  `}n(kt,"$$BarRatHtml");function yt(e,t){return wt.call({props:e},e,t)}n(yt,"DashPanelRatHtml");function wt(e,t){const l=k(()=>T);return u`
    <section.panel.dash aria-label="Start">
      <div.dash-body>
        <button.dash-search onclick=${r(()=>U("url"))}>Search or URL</button>
        <div.dash-grid>
          ${x(()=>l.value,o=>o,o=>u`
              <div.tile onclick=${r(()=>X(o.url))}>
                <span.fav>${()=>K(S(o.url))}</span>
                <b>${()=>o.title||S(o.url)}</b>
              </div>
            `)}
        </div>
        ${P(()=>!l.value.length,()=>u`<p.empty>no bookmarks yet</p>`)}
      </div>
    </section>
  `}n(wt,"$$DashPanelRatHtml");function xt(e,t){return Tt.call({props:e},e,t)}n(xt,"EnginesPanelRatHtml");function Tt(e,t){const l=k(()=>J),o=k(()=>H);let a=y(null);const c=n(d=>{a.value={engine:{...d??{icon:"",id:I("e"),name:"",url:""}},isDefault:d?.id===l.value,known:!!d}},"edit"),i=n(d=>v=>{a.value={...a.value,engine:{...a.value.engine,[d]:v.currentTarget.value}}},"field");function p(){const{engine:d,isDefault:v}=a.value,s=d.url.trim();s&&(ft({...d,icon:d.icon.trim(),name:d.name.trim()||"Search",url:s}),v&&(l.value=d.id)),a.value=null}n(p,"save");function $(){$t(a.value.engine.id),a.value=null}return n($,"remove"),u`
    <section.panel.sheet aria-label="Search engines">
      <button.backdrop aria-label="Close" onclick=${r(M)} />
      <div.sheet-body>
        <div.sheet-head>
          <span.sheet-title>Search engines</span>
          <span.sheet-actions><button.txt-btn onclick=${r(()=>c(null))}>Add</button></span>
        </div>
        ${P(()=>a.value,()=>u`
            <div.editor>
              <input.in placeholder="Name" value=${()=>a.value.engine.name} oninput=${r(i("name"))} />
              <input.in placeholder="URL with %s for the query, e.g. https://example.com/?q=%s" inputmode="url" autocapitalize="off" spellcheck="false" value=${()=>a.value.engine.url} oninput=${r(i("url"))} />
              <input.in placeholder="Icon URL (optional)" inputmode="url" autocapitalize="off" spellcheck="false" value=${()=>a.value.engine.icon} oninput=${r(i("icon"))} />
              <label.switch-row>
                <span>Default</span>
                <input type="checkbox" checked=${()=>a.value.isDefault} onchange=${r(d=>a.value={...a.value,isDefault:d.currentTarget.checked})} />
              </label>
              <div.editor-actions>
                ${P(()=>a.value.known,()=>u`<button.txt-btn.danger.push-left onclick=${r($)}>Delete</button>`)}
                <button.txt-btn onclick=${r(()=>a.value=null)}>Cancel</button>
                <button.txt-btn.primary onclick=${r(p)}>Save</button>
              </div>
            </div>
          `,()=>u`
            <ul.rows>
              ${x(()=>o.value,d=>d,d=>u`
                  <li.row onclick=${r(()=>c(d))}>
                    <span.ricon>${()=>K(d.name)}</span>
                    <span.rtext>
                      <b>${()=>d.name}</b>
                      <span>${()=>d.url}</span>
                      ${P(()=>d.id===l.value,()=>u`<span.tags><span.tag>Default</span></span>`)}
                    </span>
                    <button.icon-btn aria-label="Edit" onclick=${r(v=>{v.stopPropagation(),c(d)})}><svg-icon icon="pencil" /></button>
                  </li>
                `)}
            </ul>
            ${P(()=>!o.value.length,()=>u`<p.empty>no entries yet</p>`)}
          `)}
      </div>
    </section>
  `}n(Tt,"$$EnginesPanelRatHtml");function St(e,t){return Ct.call({props:e},e,t)}n(St,"FindPanelRatHtml");function Ct(e,t){let l=y(""),o=y(null);setTimeout(()=>o.value?.focus(),30);const a=ue.addListener("find",({count:i,done:p,index:$}={})=>{l.value=i?`${$+1}/${i}`:p?"0/0":""});Ie(()=>Promise.resolve(a).then(i=>i?.remove?.()));function c(i){i.preventDefault(),C("findNext",{forward:!0})}return n(c,"next"),u`
    <section.panel.find aria-label="Find in page">
      <form.findbar onsubmit=${r(c)}>
        <input.find-input type="text" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="Find in page" ref=${Y(o)} oninput=${r(i=>C("findInPage",{query:i.currentTarget.value}))} />
        <span.find-count>${()=>l.value}</span>
        <button.ic type="button" aria-label="Previous" onclick=${r(()=>C("findNext",{forward:!1}))}>‹</button>
        <button.ic type="submit" aria-label="Next">›</button>
        <button.ic type="button" aria-label="Close" onclick=${r(M)}>×</button>
      </form>
    </section>
  `}n(Ct,"$$FindPanelRatHtml");const ee=n(e=>String(e).replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t]),"escapeHtml"),Pt=n(({bookmarks:e,bookmarkFolders:t})=>JSON.stringify({bookmarks:e,bookmarkFolders:t},null,2),"toJson");function Rt({bookmarks:e,bookmarkFolders:t}){const l=n(a=>{const c=a.tags?.length?` TAGS="${ee(a.tags.join(","))}"`:"";return`    <DT><A HREF="${ee(a.url)}"${c}>${ee(a.title||S(a.url))}</A>
`},"link");let o=`<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;for(const a of t){const c=e.filter(i=>i.folder===a.id);if(c.length){o+=`    <DT><H3>${ee(a.name)}</H3>
    <DL><p>
`;for(const i of c)o+="    "+l(i);o+=`    </DL><p>
`}}for(const a of e.filter(c=>!c.folder))o+=l(a);return o+`</DL><p>
`}n(Rt,"toNetscape");function Et(e){let t;try{t=JSON.parse(e)}catch{return null}const l={},o=(Array.isArray(t.bookmarkFolders)?t.bookmarkFolders:[]).filter(i=>i?.name).map(i=>{const p=I("f");return l[i.id]=p,{id:p,name:String(i.name)}});return{bookmarks:(Array.isArray(t.bookmarks)?t.bookmarks:Array.isArray(t)?t:[]).filter(i=>i?.url).map(i=>({id:I("b"),url:i.url,title:i.title||S(i.url),folder:l[i.folder],tags:Array.isArray(i.tags)?i.tags:[]})),folders:o}}n(Et,"fromJson");function Dt(e){let t;try{t=new DOMParser().parseFromString(e,"text/html")}catch{return null}const l=[...t.querySelectorAll("a[href]")];return l.length?{bookmarks:l.map(a=>({anchor:a,url:a.getAttribute("href")})).filter(({url:a})=>a&&!/^(javascript|place):/i.test(a)).map(({anchor:a,url:c})=>({id:I("b"),url:c,title:(a.textContent||S(c)).trim(),tags:(a.getAttribute("tags")||"").split(",").map(i=>i.trim()).filter(Boolean)})),folders:[]}:null}n(Dt,"fromNetscape");const At=n((e,t)=>/\.html?$/i.test(e)||/^\s*</.test(t)?"html":"json","detectFormat");async function Ht(e,t){if(he){for(const o of["DOCUMENTS","EXTERNAL"])try{const{uri:a}=await he.writeFile({path:e,data:t,directory:o,encoding:"utf8",recursive:!0});return a?a.replace(/^file:\/\//,""):`${o.toLowerCase()}/${e}`}catch{}return null}const l=URL.createObjectURL(new Blob([t],{type:"text/plain"}));return Object.assign(document.createElement("a"),{href:l,download:e}).click(),setTimeout(()=>URL.revokeObjectURL(l),1e3),e}n(Ht,"saveTextFile");function Lt(e){return new Promise((t,l)=>{e.value="",e.onchange=()=>{const o=e.files?.[0];if(!o)return;const a=new FileReader;a.onload=()=>t({name:o.name,text:String(a.result||"")}),a.onerror=()=>l(a.error),a.readAsText(o)},e.click()})}n(Lt,"pickTextFile");function Mt(e,t){return Nt.call({props:e},e,t)}n(Mt,"MarksPanelRatHtml");function Nt(e,t){const l=k(()=>T),o=k(()=>q),{dialogs:a}=RAT.app;let c=y("list"),i=y(null),p=y(null);const $=L(()=>[...new Set(l.value.flatMap(f=>f.tags??[]))].sort()),d=L(()=>(()=>{const f=$.value.includes(i.value)?i.value:null,h=f?l.value.filter(E=>E.tags?.includes(f)):l.value,A=Te(h,E=>E.folder||""),Q=[...o.value.map(E=>E.id).filter(E=>A.has(E)),...A.has("")?[""]:[]],V=n(E=>E?o.value.find(Ae=>Ae.id===E)?.name??"":o.value.length?"No folder":"","titleOf");return Q.map(E=>({id:E,marks:A.get(E),title:V(E)}))})()),v=n(f=>{i.value=i.value===f?null:f},"filterBy");async function s(){const f=await a.prompt({cancel:"Cancel",message:"the name of the folder",ok:"Create",title:"Folder",value:"Folder"});f!=null&&rt(f)}n(s,"folder");function b(f){p.value={...f,folder:f.folder??"",tags:(f.tags??[]).join(" ")},c.value="editor"}n(b,"edit");const g=n(f=>h=>{p.value={...p.value,[f]:h.currentTarget.value}},"field");function W(){st({...p.value,folder:p.value.folder||void 0,tags:p.value.tags.split(/\s+/).filter(Boolean),title:p.value.title.trim(),url:p.value.url.trim()}),c.value="list"}n(W,"save");function m(){it(p.value.id),c.value="list"}n(m,"remove");let R=y("json"),N=y(""),D=y(""),_=y(null);function w(){N.value="",D.value="",c.value="io"}n(w,"openIo");async function Ee(){const f={bookmarkFolders:o.value,bookmarks:l.value};N.value=R.value==="html"?Rt(f):Pt(f);const h=await Ht(`bookmarks.${R.value}`,N.value);D.value=h?`saved: ${h}`:"saving failed, the content above can be copied"}n(Ee,"exportMarks");function pe(f){const h=N.value.trim();if(!h)return D.value="nothing to import";const A=R.value==="html"?Dt(h):Et(h);if(!A)return D.value=`could not read this as ${R.value.toUpperCase()}`;const Q=ut(A),V=A.bookmarks.length-Q;D.value=`${Q} imported`+(V?` (${V} already there)`:"")+(f?` from ${f}`:"")}n(pe,"importText");async function De(){try{const{name:f,text:h}=await Lt(_.value);R.value=At(f,h),N.value=h,pe(f)}catch{D.value="the file could not be read"}}n(De,"loadFile");function ve(f){return u`<button.tag class:active=${()=>f===i.value} onclick=${r(h=>{h.stopPropagation(),v(f)})}>${()=>f}</button>`}return n(ve,"tagChip"),u`
    <section.panel.sheet aria-label="Bookmarks">
      <button.backdrop aria-label="Close" onclick=${r(M)} />
      <div.sheet-body>
        <div.sheet-head>
          <span.sheet-title>Bookmarks</span>
          <span.sheet-actions>
            <button.txt-btn onclick=${r(w)}>Import/Export</button>
            <button.txt-btn onclick=${r(s)}>Folder</button>
            <button.txt-btn onclick=${r(()=>{lt(),c.value="list"})}>This page</button>
          </span>
        </div>
        ${we(()=>c.value,["editor","io"],[()=>u`
              <div.editor>
                <input.in placeholder="Title" value=${()=>p.value.title} oninput=${r(g("title"))} />
                <input.in placeholder="URL" inputmode="url" autocapitalize="off" spellcheck="false" value=${()=>p.value.url} oninput=${r(g("url"))} />
                <label.field-label>Folder</label>
                <select.in onchange=${r(g("folder"))}>
                  <option value="" selected=${()=>!p.value.folder}>No folder</option>
                  ${x(()=>o.value,f=>f,f=>u`<option value=${()=>f.id} selected=${()=>f.id===p.value.folder}>${()=>f.name}</option>`)}
                </select>
                <input.in placeholder="Tags (space separated)" autocapitalize="off" spellcheck="false" value=${()=>p.value.tags} oninput=${r(g("tags"))} />
                <div.editor-actions>
                  <button.txt-btn.danger.push-left onclick=${r(m)}>Delete</button>
                  <button.txt-btn onclick=${r(()=>c.value="list")}>Cancel</button>
                  <button.txt-btn.primary onclick=${r(W)}>Save</button>
                </div>
              </div>
            `,()=>u`
              <div.editor>
                <div.seg>
                  ${x(()=>[["json","JSON"],["html","HTML"]],f=>f,f=>u`<button.seg-btn class:active=${()=>R.value===f[0]} onclick=${r(()=>R.value=f[0])}>${()=>f[1]}</button>`)}
                </div>
                <textarea.css-area spellcheck="false" placeholder="Export writes a file and shows its content here to copy. To import, load a file, or paste text here and press Import." value=${()=>N.value} oninput=${r(f=>N.value=f.currentTarget.value)} />
                ${P(()=>D.value,()=>u`<p.io-status>${()=>D.value}</p>`)}
                <input type="file" accept=".json,.html,.htm,application/json,text/html" hidden ref=${Y(_)} />
                <div.editor-actions>
                  <button.txt-btn onclick=${r(()=>c.value="list")}>Close</button>
                  <button.txt-btn onclick=${r(De)}>Load file</button>
                  <button.txt-btn onclick=${r(Ee)}>Export</button>
                  <button.txt-btn.primary onclick=${r(()=>pe())}>Import</button>
                </div>
              </div>
            `],()=>u`
            ${P(()=>$.value.length,()=>u`
                <div.tag-bar>
                  ${x(()=>$.value,f=>f,f=>u`${()=>ve(f)}`)}
                </div>
              `)}
            ${x(()=>d.value,f=>f,f=>u`
                <div.group>
                  ${P(()=>f.title,()=>u`<div.group-head><span>${()=>f.title}</span><span.line /></div>`)}
                  <ul.rows>
                    ${x(()=>f.marks,h=>h,h=>u`
                        <li.row onclick=${r(()=>X(h.url))}>
                          <span.ricon>${()=>K(S(h.url))}</span>
                          <span.rtext>
                            <b>${()=>h.title||S(h.url)}</b>
                            <span>${()=>S(h.url)}</span>
                            ${P(()=>h.tags?.length,()=>u`
                                <span.tags>
                                  ${x(()=>h.tags,A=>A,A=>u`${()=>ve(A)}`)}
                                </span>
                              `)}
                          </span>
                          <button.icon-btn aria-label="Edit" onclick=${r(A=>{A.stopPropagation(),b(h)})}><svg-icon icon="pencil" /></button>
                        </li>
                      `)}
                  </ul>
                </div>
              `)}
            ${P(()=>!l.value.length,()=>u`<p.empty>no bookmarks yet</p>`)}
          `)}
      </div>
    </section>
  `}n(Nt,"$$MarksPanelRatHtml");function Bt(e,t){return Ut.call({props:e},e,t)}n(Bt,"MenuPanelRatHtml");function Ut(e,t){const l=k(()=>Pe);let o=y(null),a=y(8);requestAnimationFrame(()=>{if(!o.value)return;const i=l.value?.anchor,p=i?.getBoundingClientRect?.(),$=p?p.left+p.width/2:i?.x??innerWidth/2;a.value=Math.min(Math.max(8,$-o.value.offsetWidth/2),innerWidth-o.value.offsetWidth-8)});function c(i){M(),i.run()}return n(c,"run"),u`
    <section.panel.menu-panel aria-label="Menu">
      <button.backdrop.backdrop-clear aria-label="Close" onclick=${r(M)} />
      <ul.menu role="menu" ref=${Y(o)} style=${()=>`left: ${a.value}px`}>
        ${x(()=>l.value?.items??[],i=>i,i=>u`
            ${P(()=>i.separator,()=>u`<li.sep role="separator" />`,()=>u`
                <li role="menuitem" class:danger=${()=>i.danger} onclick=${r(()=>c(i))}>
                  <span.mi>
                    ${P(()=>i.icon,()=>u`<svg-icon icon=${()=>i.icon} />`)}
                  </span>
                  <span>${()=>i.label}</span>
                </li>
              `)}
          `)}
      </ul>
    </section>
  `}n(Ut,"$$MenuPanelRatHtml");function Ft(e,t){return Gt.call({props:e},e,t)}n(Ft,"ScriptsPanelRatHtml");function Gt(e,t){const l=k(()=>F);let o=y(null);const a=n(p=>{o.value={...p??{code:"",css:"",enabled:!0,id:I("u"),name:""},matches:(p?.matches??[]).join(" ")}},"edit"),c=n(p=>$=>{o.value={...o.value,[p]:$.currentTarget.value}},"field");function i(){ye({...o.value,matches:o.value.matches.split(/\s+/).filter(Boolean),name:o.value.name.trim()||"Script"}),o.value=null}return n(i,"save"),u`
    <section.panel.sheet aria-label="Userscripts">
      <button.backdrop aria-label="Close" onclick=${r(M)} />
      <div.sheet-body>
        <div.sheet-head>
          <span.sheet-title>Userscripts</span>
          <span.sheet-actions><button.txt-btn onclick=${r(()=>a(null))}>New</button></span>
        </div>
        ${P(()=>o.value,()=>u`
            <div.editor>
              <input.in placeholder="Name" value=${()=>o.value.name} oninput=${r(c("name"))} />
              <input.in placeholder="Match patterns, e.g. https://*.example.com/*  (space separated)" value=${()=>o.value.matches} oninput=${r(c("matches"))} />
              <textarea.css-area spellcheck="false" placeholder="// javascript, runs once the page has loaded" value=${()=>o.value.code} oninput=${r(c("code"))} />
              <textarea.css-area spellcheck="false" placeholder="/* css, added to the page */" value=${()=>o.value.css} oninput=${r(c("css"))} />
              <label.switch-row>
                <span>Enabled</span>
                <input type="checkbox" checked=${()=>o.value.enabled!==!1} onchange=${r(p=>o.value={...o.value,enabled:p.currentTarget.checked})} />
              </label>
              <div.editor-actions>
                <button.txt-btn onclick=${r(()=>o.value=null)}>Cancel</button>
                <button.txt-btn.primary onclick=${r(i)}>Save</button>
              </div>
            </div>
          `,()=>u`
            <ul.rows>
              ${x(()=>l.value,p=>p,p=>u`
                  <li.row onclick=${r(()=>a(p))}>
                    <span.rtext>
                      <b>${()=>p.name||"Script"}</b>
                      <span>${()=>p.matches?.join(" ")||"all pages"}</span>
                    </span>
                    <input type="checkbox" checked=${()=>p.enabled!==!1} onclick=${r($=>$.stopPropagation())} onchange=${r($=>ye({...p,enabled:$.currentTarget.checked}))} />
                    <button.icon-btn aria-label="Delete" onclick=${r($=>{$.stopPropagation(),vt(p.id)})}>×</button>
                  </li>
                `)}
            </ul>
            ${P(()=>!l.value.length,()=>u`<p.empty>no userscripts yet</p>`)}
          `)}
      </div>
    </section>
  `}n(Gt,"$$ScriptsPanelRatHtml");function It(e,t){return Ot.call({props:e},e,t)}n(It,"SettingsPanelRatHtml");function Ot(e,t){const l=k(()=>ce),o=k(()=>Ce),a=k(()=>B),c=[["bottom","Bottom"],["top","Top"]];function i(s,b){const g=[...o.value];[g[s],g[s+b]]=[g[s+b],g[s]],l.value=g}n(i,"move");const p=n((s,b)=>{l.value=o.value.map(g=>g.id===s?{...g,on:b}:g)},"toggle");function $(s,b){return u`
      <div.row-field>
        <label>${()=>b}</label>
        <input type="color" value=${()=>a.value[s]} oninput=${r(g=>a.value[s]=g.currentTarget.value)} />
      </div>
    `}n($,"color");function d(s){return u`
      <div.seg>
        ${x(()=>c,b=>b,b=>u`<button.seg-btn class:active=${()=>a.value[s]===b[0]} onclick=${r(()=>a.value[s]=b[0])}>${()=>b[1]}</button>`)}
      </div>
    `}n(d,"sides");function v(s,b,g,W){return u`
      <div.range-field>
        <label>${()=>b} <b>${()=>a.value[s]}px</b></label>
        <input type="range" min=${()=>g} max=${()=>W} step="1" value=${()=>a.value[s]} oninput=${r(m=>a.value[s]=Number(m.currentTarget.value))} />
      </div>
    `}return n(v,"range"),u`
    <section.panel.sheet aria-label="Settings">
      <button.backdrop aria-label="Close" onclick=${r(M)} />
      <div.sheet-body>
        <div.sheet-head><span.sheet-title>Settings</span></div>
        <h3.grp>Colors</h3>
        ${()=>$("bg","Background")}
        ${()=>$("fg","Foreground")}
        ${()=>$("accent","Accent")}
        <label.switch-row>
          <span>Blur behind panels</span>
          <input type="checkbox" checked=${()=>a.value.blur} onchange=${r(s=>a.value.blur=s.currentTarget.checked)} />
        </label>
        <h3.grp>Search</h3>
        <div.field><button.txt-btn onclick=${r(()=>U("engines"))}>Manage search engines</button></div>
        <h3.grp>Dock</h3>
        <div.field><label>Position</label>${()=>d("dockPos")}</div>
        <div.field><label>Loading bar</label>${()=>d("loaderPos")}</div>
        ${()=>v("dockSize","Size",36,60)}
        ${()=>v("dockGap","Gap",4,28)}
        <h3.grp>Dock buttons</h3>
        <ul.rows>
          ${x(()=>o.value,s=>s,(s,b)=>u`
              <li.row>
                <span.ricon><svg-icon icon=${()=>z[s.id].icon} /></span>
                <span.rtext><b>${()=>z[s.id].label}</b></span>
                <button.icon-btn aria-label="Move up" disabled=${()=>b===0} onclick=${r(()=>i(b,-1))}>↑</button>
                <button.icon-btn aria-label="Move down" disabled=${()=>b===o.value.length-1} onclick=${r(()=>i(b,1))}>↓</button>
                <input type="checkbox" checked=${()=>s.on} onchange=${r(g=>p(s.id,g.currentTarget.checked))} />
              </li>
            `)}
        </ul>
      </div>
    </section>
  `}n(Ot,"$$SettingsPanelRatHtml");function jt(e,t){return zt.call({props:e},e,t)}n(jt,"TabsPanelRatHtml");function zt(e,t){const l=k(()=>te),o=k(()=>O),a=k(()=>ne),{dialogs:c}=RAT.app,i=L(()=>(()=>{const d=Te(o.value.tabs,s=>a.value[s.id]??"");return[...l.value.map(s=>s.id).filter(s=>d.has(s)),...d.has("")?[""]:[]].map(s=>({id:s,tabs:d.get(s),title:s&&(l.value.find(b=>b.id===s)?.name??"")}))})());function p(d){C("activateTab",{id:d.id}),M()}n(p,"activate");async function $(){const d=await c.prompt({cancel:"Cancel",message:"the name of the group",ok:"Create",title:"Group",value:"Group"});d!=null&&dt(d)}return n($,"group"),u`
    <section.panel.sheet aria-label="Tabs">
      <button.backdrop aria-label="Close" onclick=${r(M)} />
      <div.sheet-body>
        <div.sheet-head>
          <span.sheet-title>Tabs</span>
          <span.sheet-actions>
            <button.txt-btn onclick=${r($)}>Group</button>
            <button.txt-btn onclick=${r(at)}>New tab</button>
          </span>
        </div>
        ${x(()=>i.value,d=>d,d=>u`
            <div.group>
              ${P(()=>d.title,()=>u`<div.group-head><span>${()=>d.title}</span><span.line /></div>`)}
              <ul.rows>
                ${x(()=>d.tabs,v=>v,v=>u`
                    <li.row class:active=${()=>v.id===o.value.activeId} onclick=${r(()=>p(v))}>
                      <span.ricon>${()=>K(S(v.url))}</span>
                      <span.rtext>
                        <b>${()=>v.title||S(v.url)||"New tab"}</b>
                        <span>${()=>S(v.url)}</span>
                      </span>
                      <select.mini-select onclick=${r(s=>s.stopPropagation())} onchange=${r(s=>ct(v.id,s.currentTarget.value))}>
                        <option value="" selected=${()=>!a.value[v.id]}>—</option>
                        ${x(()=>l.value,s=>s,s=>u`<option value=${()=>s.id} selected=${()=>a.value[v.id]===s.id}>${()=>s.name}</option>`)}
                      </select>
                      <button.icon-btn aria-label="Close tab" onclick=${r(s=>{s.stopPropagation(),C("closeTab",{id:v.id})})}>×</button>
                    </li>
                  `)}
              </ul>
            </div>
          `)}
      </div>
    </section>
  `}n(zt,"$$TabsPanelRatHtml");function qt(e,t){return Jt.call({props:e},e,t)}n(qt,"UrlPanelRatHtml");function Jt(e,t){const l=k(()=>le),o=k(()=>T),a=k(()=>J),c=k(()=>H),i=k(()=>O),p=12,$=/^[a-z]+:\/\//i;let d=y(l.value?.url??""),v=y(null);setTimeout(()=>{v.value?.focus(),v.value?.select()},30);const s=L(()=>(()=>{const m=d.value.trim(),R=m.toLowerCase(),N=se(m);if(N)return[{sub:Ke(N),title:N.text,url:m}];const D=[];R&&(R.includes(".")||R.includes(" ")||$.test(R))&&D.push({sub:ie(m)?"open":"search",title:m,url:m});const _=[...o.value.map(w=>({sub:S(w.url),tags:w.tags?.join(" "),title:w.title||S(w.url),url:w.url})),...i.value.tabs.filter(w=>w.id!==i.value.activeId).map(w=>({sub:`${S(w.url)} · tab`,title:w.title||S(w.url),url:w.url}))];for(const w of _){if(D.length>=p)break;(!R||`${w.title} ${w.url} ${w.tags??""}`.toLowerCase().includes(R))&&D.push(w)}return D})()),b=L(()=>!!d.value.trim()&&!ie(d.value.trim())&&!se(d.value.trim()));let g=y(new Set);function W(m){m.preventDefault(),X(d.value)}return n(W,"submit"),u`
    <section.panel aria-label="Address">
      <button.backdrop aria-label="Close" onclick=${r(M)} />
      <div.panel-scroll>
        <ul.suggest>
          ${x(()=>s.value,m=>m,m=>u`<li onclick=${r(()=>X(m.url))}><b>${()=>m.title}</b><span>${()=>m.sub}</span></li>`)}
        </ul>
      </div>
      ${P(()=>b.value,()=>u`
          <div.engine-row>
            ${x(()=>c.value,m=>m,m=>u`
                <button.eng class:default=${()=>m.id===a.value} title=${()=>m.name} onclick=${r(()=>X(d.value,m.id))}>
                  ${P(()=>m.icon&&!g.value.has(m.id),()=>u`<img src=${()=>m.icon} alt="" onerror=${r(()=>g.value=new Set([...g.value,m.id]))} />`,()=>u`${()=>K(m.name)}`)}
                </button>
              `)}
          </div>
        `)}
      <form.urlbar onsubmit=${r(W)}>
        <input.url-input type="text" inputmode="url" autocapitalize="off" autocomplete="off" spellcheck="false" placeholder="Search or enter URL" ref=${Y(v)} value=${()=>d.value} oninput=${r(m=>d.value=m.currentTarget.value)} />
        <button.go type="submit" aria-label="Go"><svg-icon icon="go" /></button>
      </form>
    </section>
  `}n(Jt,"$$UrlPanelRatHtml");function Zt(e,t){return Wt.call({props:e},e,t)}n(Zt,"AppRatHtml");function Wt(e,t){const l=k(()=>j);return Oe("cos",je,1.8),RAT.app.on("error",bt.error),RAT.app.hold(Ve()),u`
    <${ht} />
    ${we(()=>l.value,["dash","engines","find","marks","menu","scripts","settings","tabs","url"],[()=>u`<${yt} />`,()=>u`<${xt} />`,()=>u`<${St} />`,()=>u`<${Mt} />`,()=>u`<${Bt} />`,()=>u`<${Ft} />`,()=>u`<${It} />`,()=>u`<${jt} />`,()=>u`<${qt} />`])}
  `}n(Wt,"$$AppRatHtml");export{Zt as default};

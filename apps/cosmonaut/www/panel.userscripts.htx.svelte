<script>
  const phCSS = `/* css, added to the page */`
  const phJS  = `// javascript, runs once the page has loaded`;
</script>

<app-panel name='userscripts'>
  <header>
    userscripts
    <div>
      <btn-icon 'add' />
    </div>
  </header>
  <main>
    
  </main>
</app-panel>

<section id="panelScripts" class="panel sheet" hidden aria-label="Userscripts">
    <button class="backdrop" data-close aria-label="Close"></button>
    <div class="sheet-body">
        <div class="sheet-head">
            <span class="sheet-title">Userscripts</span>
            <span class="sheet-actions"><button id="newScriptBtn" class="txt-btn">New</button></span>
        </div>
              
        <ul id="scriptList" class="rows"></ul>
          
        <p id="scriptsEmpty" class="empty">no userscripts yet</p>
        
        <div id="scriptEditor" class="editor" hidden>
            <input-text id="scriptName"    class="in" placeholder="Name" />
            <input-text id="scriptMatches" class="in" placeholder="Match patterns, e.g. https://*.example.com/*  (space separated)" />
            <textarea id="scriptCode"    class="css-area" spellcheck="false" placeholder=${phJS}></textarea>
            <textarea id="scriptCss"     class="css-area" spellcheck="false" placeholder="{phCSS}"></textarea>
            <label class="switch-row"><span>Enabled</span><input id="scriptEnabled" type="checkbox" checked /></label>
            <div-x class='actions'>
                <btn-push 'cancel' id="scriptCancel" />
                <btn-push 'cancel' id="scriptSave"   />
            </div-x>
        </div>
              
    </div>
</section>

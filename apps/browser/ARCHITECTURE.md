# Browser architecture

A minimalist browser built on the system WebView (Chromium). The twist that makes
the whole thing work is the **two-layer split**, and it is the invariant to keep
in mind whenever you touch the native side or the chrome layout.

## Two layers

```
 ┌──────────────────────────────────────────┐
 │  chrome  = the capacitor bridge WebView   │  ← transparent, on top (www/)
 │  (pill, url bar, tabs, bookmarks)         │
 ├──────────────────────────────────────────┤
 │  content = native android WebViews        │  ← one per tab, behind
 │  (the actual websites)                    │
 └──────────────────────────────────────────┘
```

- **content**: `BrowserPlugin` creates one native `WebView` per tab inside a
  `contentContainer` `FrameLayout`. Only the active tab's view is `VISIBLE`.
- **chrome**: the Capacitor bridge WebView, made transparent and reparented (in
  `MainActivity`) into a root `FrameLayout` **above** the content container. It
  renders the ui in `www/` (plain js) and drives the content via the plugin.

Capacitor's model is "one WebView = your app", so a browser (many content views +
a ui overlay) does not fit out of the box. Reparenting the bridge WebView is how
we get both.

## The resize trick (instead of touch pass-through)

A transparent full-screen WebView on top would still eat every touch, so the
content below would be dead. Rather than punching touch-through holes, we size the
chrome WebView to exactly the region it needs:

- **collapsed**: chrome WebView = a bottom **strip** (~104dp) holding the pill +
  the two trigger buttons. Everything above the strip is the content WebView and
  is fully interactive.
- **expanded**: chrome WebView = **fullscreen** (modal) while a panel (url / tabs
  / bookmarks) is open; it legitimately owns all touches then.

`MainActivity.setChromeExpanded(boolean)` swaps the chrome WebView's layout height
between `collapsedPx` and `MATCH_PARENT`. The chrome js calls
`Browser.setChromeExpanded({expanded})` around opening/closing a panel. Because the
chrome html anchors its bar to `bottom:0`, the same document renders correctly at
both heights: strip shows only the bar; fullscreen shows the panel above it.

So the chrome css MUST keep the bar bottom-anchored and panels as `position:fixed`
overlays — do not rely on document flow height, since the viewport height changes
underneath it.

## Native <-> chrome contract

Plugin methods (all marshalled onto the ui thread; webview calls must be):
`ready`, `getState`, `navigate({url})`, `newTab({url?})`, `closeTab({id})`,
`activateTab({id})`, `goBack`, `goForward`, `reload`, `setChromeExpanded({expanded})`.

The plugin emits a **`state`** event on every change:
`{ tabs: [{id,url,title,loading,progress,canGoBack}], activeId, expanded }`.
The chrome re-renders from that and never keeps its own copy of the tab list.

`MainActivity.onBackPressed` -> `BrowserPlugin.handleBack()`: collapse an open
panel first, else `goBack()` the active tab, else default. Collapsing emits a
`state` with `expanded:false`, which the chrome uses to hide any open panel — so
the hardware back button and tapping the backdrop stay in sync.

## What lives where

- **native**: tabs and their url/title/loading/canGoBack; navigation; url-vs-search
  normalization; the resize.
- **chrome (localStorage)**: bookmarks, tab **groups** and group membership
  (keyed by native tab id). grouping is pure organization, so it stays out of
  native. auto-grouping (later) is chrome-side logic over tab domains.

## Theme

Exactly **two css tokens** (`--bg`, `--fg`); every other shade is `color-mix` of
them. Retheming = change two values. Keep it that way.

## Dock + settings

The dock is configurable (chrome-side, `localStorage` `browser.settings`): which
buttons show, their order (they split evenly around the pill), size, gap, and the
dock/loader position (top or bottom — dock position also calls
`BrowserPlugin.setDockPosition`, which re-anchors the native strip). Colors are
three tokens `--bg/--fg/--accent`. Buttons: tabs, bookmarks, find-in-page,
dev-tools, userscripts, settings.

- **find**: `findInPage/findNext/clearFind` drive the native `WebView.findAllAsync`;
  a `find` event reports the match count. its panel is a transparent bar so the
  page stays visible.
- **dev-tools**: `toggleDevtools` injects/removes eruda in the active page
  (best-effort; needs network + a permissive page CSP). `setWebContentsDebuggingEnabled`
  is on for chrome://inspect over USB.
- **userscripts**: managed chrome-side; the list is pushed to native
  (`setUserscripts`) and injected at document-end into pages whose url matches a
  script's `matches` glob. No GM_* API yet.

## Not yet

full GM_* userscript api, auto tab-grouping, configurable pill gestures
(long-press / hold-drag), per-tab back/forward ui, downloads, `window.open`/
new-window handling, external-scheme (mailto/intent) handling.

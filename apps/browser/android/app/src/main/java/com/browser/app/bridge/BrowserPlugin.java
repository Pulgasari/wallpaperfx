package com.browser.app.bridge;

import android.annotation.SuppressLint;
import android.graphics.Bitmap;
import android.net.Uri;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import com.browser.app.MainActivity;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// owns the native content webviews (one per tab) that live behind the transparent
// chrome. the chrome (www) drives it via these methods and re-renders on "state"
// events. grouping + bookmarks are chrome-side metadata; this side only knows the
// tabs and their url/title/loading/canGoBack. see ../../ARCHITECTURE.md.
@CapacitorPlugin(name = "Browser")
public class BrowserPlugin extends Plugin {

    private static final String HOME = "https://duckduckgo.com/";

    private static class Tab {
        String id;
        WebView view;
        String url = "";
        String title = "";
        boolean loading = false;
        int progress = 0;
        boolean canGoBack = false;
    }

    private final Map<String, Tab> tabs = new LinkedHashMap<>();
    private String activeId = null;
    private int counter = 0;
    private boolean expanded = false;

    private MainActivity activity() { return (MainActivity) getActivity(); }
    private FrameLayout container() { return activity().getContentContainer(); }
    private void ui(Runnable r) { activity().runOnUiThread(r); }

    // ---- lifecycle ----

    @PluginMethod
    public void ready(PluginCall call) {
        ui(() -> {
            if (tabs.isEmpty()) openTab(HOME);
            call.resolve(state());
        });
    }

    @PluginMethod
    public void getState(PluginCall call) {
        ui(() -> call.resolve(state()));
    }

    // ---- navigation ----

    @PluginMethod
    public void navigate(PluginCall call) {
        final String input = call.getString("url", "");
        ui(() -> {
            Tab t = active();
            if (t == null) t = openTab(null);
            t.view.loadUrl(toUrl(input));
            setExpanded(false);
            call.resolve(state());
        });
    }

    @PluginMethod
    public void newTab(PluginCall call) {
        final String url = call.getString("url", null);
        ui(() -> {
            openTab(url == null || url.isEmpty() ? HOME : toUrl(url));
            call.resolve(state());
        });
    }

    @PluginMethod
    public void closeTab(PluginCall call) {
        final String id = call.getString("id", "");
        ui(() -> {
            removeTab(id);
            call.resolve(state());
        });
    }

    @PluginMethod
    public void activateTab(PluginCall call) {
        final String id = call.getString("id", "");
        ui(() -> {
            if (tabs.containsKey(id)) show(id);
            call.resolve(state());
        });
    }

    @PluginMethod
    public void goBack(PluginCall call) {
        ui(() -> {
            Tab t = active();
            if (t != null && t.view.canGoBack()) t.view.goBack();
            call.resolve(state());
        });
    }

    @PluginMethod
    public void goForward(PluginCall call) {
        ui(() -> {
            Tab t = active();
            if (t != null && t.view.canGoForward()) t.view.goForward();
            call.resolve(state());
        });
    }

    @PluginMethod
    public void reload(PluginCall call) {
        ui(() -> {
            Tab t = active();
            if (t != null) t.view.reload();
            call.resolve(state());
        });
    }

    @PluginMethod
    public void setChromeExpanded(PluginCall call) {
        final boolean ex = call.getBoolean("expanded", false);
        ui(() -> { setExpanded(ex); call.resolve(state()); });
    }

    // called from MainActivity.onBackPressed (ui thread). returns true if consumed.
    public boolean handleBack() {
        if (expanded) { setExpanded(false); return true; }
        Tab t = active();
        if (t != null && t.view.canGoBack()) { t.view.goBack(); return true; }
        return false;
    }

    // ---- internals ----

    private Tab active() { return activeId == null ? null : tabs.get(activeId); }

    private void setExpanded(boolean ex) {
        expanded = ex;
        activity().setChromeExpanded(ex);
        emit();
    }

    @SuppressLint("SetJavaScriptEnabled")
    private Tab openTab(String url) {
        Tab t = new Tab();
        t.id = "t" + (++counter);
        WebView wv = new WebView(getContext());
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(true);
        s.setDisplayZoomControls(false);
        s.setSupportMultipleWindows(false);
        s.setMediaPlaybackRequiresUserGesture(true);

        wv.setWebViewClient(new WebViewClient() {
            @Override public void onPageStarted(WebView v, String u, Bitmap f) {
                t.loading = true; t.url = u; emit();
            }
            @Override public void onPageFinished(WebView v, String u) {
                t.loading = false; t.url = v.getUrl(); t.title = v.getTitle();
                t.canGoBack = v.canGoBack(); emit();
            }
            @Override public void doUpdateVisitedHistory(WebView v, String u, boolean reload) {
                t.url = v.getUrl(); t.canGoBack = v.canGoBack(); emit();
            }
        });
        wv.setWebChromeClient(new WebChromeClient() {
            @Override public void onReceivedTitle(WebView v, String title) { t.title = title; emit(); }
            @Override public void onProgressChanged(WebView v, int p) { t.progress = p; emit(); }
        });

        t.view = wv;
        tabs.put(t.id, t);
        container().addView(wv, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        if (url != null) wv.loadUrl(url);
        show(t.id);
        return t;
    }

    private void show(String id) {
        activeId = id;
        for (Map.Entry<String, Tab> e : tabs.entrySet()) {
            e.getValue().view.setVisibility(e.getKey().equals(id) ? View.VISIBLE : View.GONE);
        }
        emit();
    }

    private void removeTab(String id) {
        Tab t = tabs.remove(id);
        if (t != null) {
            container().removeView(t.view);
            t.view.destroy();
        }
        if (id.equals(activeId)) {
            activeId = null;
            // fall back to the last remaining tab, or open a fresh home tab
            String last = null;
            for (String k : tabs.keySet()) last = k;
            if (last != null) show(last);
            else openTab(HOME);
        } else {
            emit();
        }
    }

    // treat input as a url if it has a scheme or looks like a domain; else search.
    private String toUrl(String input) {
        String v = input == null ? "" : input.trim();
        if (v.isEmpty()) return HOME;
        if (v.matches("(?i)^[a-z][a-z0-9+.-]*://.*")) return v;
        if (v.contains(" ") || !v.contains(".")) return "https://duckduckgo.com/?q=" + Uri.encode(v);
        return "https://" + v;
    }

    // ---- state ----

    private void emit() { notifyListeners("state", state()); }

    private JSObject state() {
        JSArray arr = new JSArray();
        List<String> order = new ArrayList<>(tabs.keySet());
        for (String id : order) {
            Tab t = tabs.get(id);
            JSObject o = new JSObject();
            o.put("id", t.id);
            o.put("url", t.url == null ? "" : t.url);
            o.put("title", t.title == null ? "" : t.title);
            o.put("loading", t.loading);
            o.put("progress", t.progress);
            o.put("canGoBack", t.canGoBack);
            arr.put(o);
        }
        JSObject ret = new JSObject();
        ret.put("tabs", arr);
        ret.put("activeId", activeId == null ? "" : activeId);
        ret.put("expanded", expanded);
        return ret;
    }
}

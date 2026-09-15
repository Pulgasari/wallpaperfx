package com.browser.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.WebView;
import android.widget.FrameLayout;

import com.getcapacitor.BridgeActivity;
import com.browser.app.bridge.BrowserPlugin;

// the capacitor bridge webview is our transparent "chrome" (pill, url bar, tabs).
// we reparent it into a root FrameLayout with a content container BEHIND it that
// holds the native content webviews (one per tab). the chrome webview is sized to
// a bottom strip when collapsed and to fullscreen when expanded, which is how
// touches reach the content below without any pass-through hackery.
public class MainActivity extends BridgeActivity {

    private FrameLayout contentContainer;
    private WebView chrome;
    private int collapsedPx;
    private int dockGravity = Gravity.BOTTOM; // dock strip anchor (top or bottom)

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BrowserPlugin.class);
        super.onCreate(savedInstanceState);

        collapsedPx = Math.round(getResources().getDisplayMetrics().density * 104);

        chrome = getBridge().getWebView();
        chrome.setBackgroundColor(Color.TRANSPARENT);
        ViewGroup oldParent = (ViewGroup) chrome.getParent();
        if (oldParent != null) oldParent.removeView(chrome);

        FrameLayout root = new FrameLayout(this);
        contentContainer = new FrameLayout(this);
        // content is inset by the dock strip so the closed bar reserves its own
        // space instead of overlapping the page. previously the content was
        // full-screen behind a transparent strip, so the bottom collapsedPx of
        // every page sat under the (touch-eating) chrome webview.
        FrameLayout.LayoutParams contentLp = new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        applyContentInset(contentLp);
        root.addView(contentContainer, contentLp);

        root.addView(chrome, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, collapsedPx, dockGravity));

        setContentView(root);
    }

    public FrameLayout getContentContainer() { return contentContainer; }

    // keeps a collapsedPx gap on whichever side the dock strip occupies
    private void applyContentInset(FrameLayout.LayoutParams lp) {
        lp.topMargin    = (dockGravity == Gravity.TOP)    ? collapsedPx : 0;
        lp.bottomMargin = (dockGravity == Gravity.BOTTOM) ? collapsedPx : 0;
    }

    private boolean chromeExpanded = false;

    // fullscreen (modal panels) vs a strip (just the dock) anchored top or bottom.
    public void setChromeExpanded(boolean expanded) {
        chromeExpanded = expanded;
        runOnUiThread(() -> {
            FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) chrome.getLayoutParams();
            lp.height = expanded ? ViewGroup.LayoutParams.MATCH_PARENT : collapsedPx;
            lp.gravity = dockGravity;
            chrome.setLayoutParams(lp);
        });
    }

    // move the collapsed dock strip to the top or bottom of the screen, and move
    // the content inset with it so the bar keeps reserving its own space.
    public void setDockPosition(boolean top) {
        dockGravity = top ? Gravity.TOP : Gravity.BOTTOM;
        runOnUiThread(() -> {
            FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) chrome.getLayoutParams();
            lp.gravity = dockGravity;
            chrome.setLayoutParams(lp);
            FrameLayout.LayoutParams cp = (FrameLayout.LayoutParams) contentContainer.getLayoutParams();
            applyContentInset(cp);
            contentContainer.setLayoutParams(cp);
        });
    }

    @Override
    public void onBackPressed() {
        try {
            BrowserPlugin p = (BrowserPlugin) getBridge().getPlugin("Browser").getInstance();
            if (p != null && p.handleBack()) return;
        } catch (Exception ignored) {}
        super.onBackPressed();
    }
}

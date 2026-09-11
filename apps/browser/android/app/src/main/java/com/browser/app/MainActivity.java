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
        root.addView(contentContainer, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        root.addView(chrome, new FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, collapsedPx, Gravity.BOTTOM));

        setContentView(root);
    }

    public FrameLayout getContentContainer() { return contentContainer; }

    // fullscreen (modal panels) vs bottom strip (just the pill + triggers).
    public void setChromeExpanded(boolean expanded) {
        runOnUiThread(() -> {
            FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) chrome.getLayoutParams();
            lp.height = expanded ? ViewGroup.LayoutParams.MATCH_PARENT : collapsedPx;
            lp.gravity = Gravity.BOTTOM;
            chrome.setLayoutParams(lp);
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

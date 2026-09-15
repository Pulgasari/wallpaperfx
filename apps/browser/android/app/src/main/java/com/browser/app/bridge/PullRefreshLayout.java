package com.browser.app.bridge;

import android.content.Context;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;
import android.webkit.WebView;
import android.widget.FrameLayout;

// wraps a content webview and turns an overscroll-at-top pull into a reload, and a
// pull-and-hold into a hard reload. the gesture happens on the native content view,
// which the transparent chrome webview never sees — so it lives here on the native
// side, not in a chrome-js gesture lib.
//
// feedback: the webview follows the finger (damped), a small dot rides the revealed
// gap and switches color once the pull is armed, then again once hold arms hard.
public class PullRefreshLayout extends FrameLayout {

    public interface Action { void run(); }

    private static final int COLOR_IDLE = 0xFF9AA0A6; // neutral grey
    private static final int COLOR_ARMED = 0xFFFFFFFF; // reload armed
    private static final int COLOR_HARD  = 0xFFFF9F45; // hard reload armed

    private final WebView web;
    private final View dot;
    private final int touchSlop;
    private final float triggerPx;   // pull distance that arms a reload
    private final float maxPullPx;   // rubber-band cap
    private final int dotPx;
    private final int holdMs = 500;  // hold past the trigger -> hard reload

    private Action onReload, onHardReload;
    private float startY;
    private boolean pulling;   // an overscroll drag is in progress
    private boolean armed;     // pulled past the trigger
    private boolean hardFired; // hard reload dispatched this gesture

    private final Runnable holdRunnable = () -> {
        if (!pulling || !armed || hardFired) return;
        hardFired = true;
        tint(COLOR_HARD);
        performHapticFeedback(HapticFeedbackConstants.LONG_PRESS);
        if (onHardReload != null) onHardReload.run();
    };

    public PullRefreshLayout(Context context, WebView web) {
        super(context);
        this.web = web;
        float density = getResources().getDisplayMetrics().density;
        touchSlop = ViewConfiguration.get(context).getScaledTouchSlop();
        triggerPx = density * 56f;   // damped pull distance that arms a reload
        maxPullPx = density * 96f;   // rubber-band cap
        dotPx = Math.round(density * 26f);

        addView(web, new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

        dot = new View(context);
        GradientDrawable bg = new GradientDrawable();
        bg.setShape(GradientDrawable.OVAL);
        bg.setColor(COLOR_IDLE);
        dot.setBackground(bg);
        dot.setAlpha(0f);
        LayoutParams dp = new LayoutParams(dotPx, dotPx, Gravity.TOP | Gravity.CENTER_HORIZONTAL);
        dp.topMargin = Math.round(density * 10f);
        addView(dot, dp);
    }

    public void setListeners(Action onReload, Action onHardReload) {
        this.onReload = onReload;
        this.onHardReload = onHardReload;
    }

    // intercept only an at-top downward drag; everything else stays with the webview
    // (normal scroll, taps, zoom are untouched).
    @Override
    public boolean onInterceptTouchEvent(MotionEvent e) {
        switch (e.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                startY = e.getY();
                pulling = false;
                return false;
            case MotionEvent.ACTION_MOVE:
                if (!pulling && atTop() && e.getY() - startY > touchSlop) {
                    pulling = true;
                    return true;
                }
                return false;
            default:
                return false;
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent e) {
        if (!pulling) return false;
        switch (e.getActionMasked()) {
            case MotionEvent.ACTION_MOVE: {
                float dy = Math.max(0f, e.getY() - startY);
                float pull = Math.min(maxPullPx, dy * 0.5f);
                float progress = Math.min(1f, pull / triggerPx);
                web.setTranslationY(pull);
                dot.setTranslationY(pull - dotPx);
                dot.setAlpha(progress);
                dot.setScaleX(0.6f + 0.4f * progress);
                dot.setScaleY(dot.getScaleX());
                boolean nowArmed = pull >= triggerPx;
                if (nowArmed && !armed) {
                    armed = true;
                    tint(COLOR_ARMED);
                    performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                    postDelayed(holdRunnable, holdMs);
                } else if (!nowArmed && armed) {
                    armed = false;
                    hardFired = false;
                    tint(COLOR_IDLE);
                    removeCallbacks(holdRunnable);
                }
                return true;
            }
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                removeCallbacks(holdRunnable);
                if (armed && !hardFired && onReload != null) onReload.run();
                release();
                return true;
            default:
                return false;
        }
    }

    private boolean atTop() { return !web.canScrollVertically(-1); }

    private void tint(int color) {
        ((GradientDrawable) dot.getBackground()).setColor(color);
    }

    private void release() {
        pulling = false;
        armed = false;
        hardFired = false;
        web.animate().translationY(0f).setDuration(180).start();
        dot.animate().alpha(0f).setDuration(180).withEndAction(() -> tint(COLOR_IDLE)).start();
    }
}

package com.launcher.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.launcher.app.bridge.LauncherPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(LauncherPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

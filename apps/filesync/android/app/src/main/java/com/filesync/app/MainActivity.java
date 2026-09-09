package com.filesync.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.filesync.app.bridge.FileSyncPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FileSyncPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

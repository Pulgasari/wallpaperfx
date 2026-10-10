package dev.subotnik.wallpapers;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import dev.subotnik.wallpapers.bridge.WallpaperPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WallpaperPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

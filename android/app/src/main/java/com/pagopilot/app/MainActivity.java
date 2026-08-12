package com.pagopilot.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        registerPlugin(BiometricAuthPlugin.class);
        registerPlugin(AppLauncherPlugin.class);
        super.onCreate(savedInstanceState);
    }
}

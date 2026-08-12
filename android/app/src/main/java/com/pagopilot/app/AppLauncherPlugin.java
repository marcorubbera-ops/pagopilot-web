package com.pagopilot.app;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Launches another installed app by package name, or a fallback URL when
 * it's not installed. More reliable than the classic custom-scheme +
 * visibility-timeout trick, which depends on the WebView losing focus in a
 * way that isn't guaranteed inside a Capacitor app.
 */
@CapacitorPlugin(name = "AppLauncher")
public class AppLauncherPlugin extends Plugin {

    @PluginMethod
    public void openPackageOrFallback(PluginCall call) {
        String packageName = call.getString("packageName");
        String fallbackUrl = call.getString("fallbackUrl");

        if (packageName == null) {
            call.reject("packageName is required");
            return;
        }

        PackageManager pm = getContext().getPackageManager();
        Intent launchIntent = pm.getLaunchIntentForPackage(packageName);

        JSObject ret = new JSObject();

        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(launchIntent);
            ret.put("opened", "app");
            call.resolve(ret);
            return;
        }

        if (fallbackUrl != null) {
            Intent viewIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(fallbackUrl));
            viewIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(viewIntent);
        }
        ret.put("opened", "fallback");
        call.resolve(ret);
    }
}

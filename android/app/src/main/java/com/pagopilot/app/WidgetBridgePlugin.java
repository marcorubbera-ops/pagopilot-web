package com.pagopilot.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Bridges the "next due payment" from the web app into the home-screen widget. */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    static final String PREFS_NAME = "widget_next_payment";

    @PluginMethod
    public void updateNextPayment(PluginCall call) {
        Context context = getContext();
        SharedPreferences.Editor editor = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE).edit();

        boolean empty = call.getBoolean("empty", true);
        editor.putBoolean("empty", empty);
        if (!empty) {
            editor.putString("title", call.getString("title", ""));
            editor.putString("entity", call.getString("entity", ""));
            editor.putString("amountLabel", call.getString("amountLabel", ""));
            editor.putString("dueLabel", call.getString("dueLabel", ""));
        }
        editor.apply();

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        ComponentName component = new ComponentName(context, NextPaymentWidgetProvider.class);
        int[] ids = manager.getAppWidgetIds(component);
        if (ids.length > 0) {
            Intent intent = new Intent(context, NextPaymentWidgetProvider.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids);
            context.sendBroadcast(intent);
        }

        call.resolve();
    }
}

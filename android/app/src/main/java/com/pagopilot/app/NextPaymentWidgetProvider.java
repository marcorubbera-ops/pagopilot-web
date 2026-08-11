package com.pagopilot.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.View;
import android.widget.RemoteViews;

/** Renders the small "next payment" home-screen widget from the SharedPreferences snapshot WidgetBridgePlugin writes. */
public class NextPaymentWidgetProvider extends AppWidgetProvider {

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId);
        }
    }

    private void updateWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        SharedPreferences prefs = context.getSharedPreferences(WidgetBridgePlugin.PREFS_NAME, Context.MODE_PRIVATE);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_next_payment);

        boolean empty = prefs.getBoolean("empty", true);
        if (empty) {
            views.setTextViewText(R.id.widget_title, context.getString(R.string.widget_empty_title));
            views.setViewVisibility(R.id.widget_entity, View.GONE);
            views.setViewVisibility(R.id.widget_amount_row, View.GONE);
        } else {
            views.setTextViewText(R.id.widget_title, prefs.getString("title", ""));

            String entity = prefs.getString("entity", "");
            if (entity == null || entity.isEmpty()) {
                views.setViewVisibility(R.id.widget_entity, View.GONE);
            } else {
                views.setViewVisibility(R.id.widget_entity, View.VISIBLE);
                views.setTextViewText(R.id.widget_entity, entity);
            }

            views.setViewVisibility(R.id.widget_amount_row, View.VISIBLE);
            views.setTextViewText(R.id.widget_amount, prefs.getString("amountLabel", ""));
            views.setTextViewText(R.id.widget_due, prefs.getString("dueLabel", ""));
        }

        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (launchIntent != null) {
            launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pendingIntent = PendingIntent.getActivity(
                context,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
        }

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }
}

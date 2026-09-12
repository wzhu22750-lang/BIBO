package love.bibu.space

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.view.View
import android.widget.RemoteViews

class BibuWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_REFRESH) {
            updateAll(context)
        }
    }

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        WidgetMidnightReceiver.scheduleNextMidnight(context)
    }

    override fun onDisabled(context: Context) {
        super.onDisabled(context)
        WidgetMidnightReceiver.cancelMidnight(context)
    }

    companion object {
        const val ACTION_REFRESH = "love.bibu.WIDGET_REFRESHED"

        fun updateAll(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, BibuWidgetProvider::class.java)
            val allIds = appWidgetManager.getAppWidgetIds(thisWidget)
            for (id in allIds) {
                updateWidget(context, appWidgetManager, id)
            }
        }

        private fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.widget_bibu)
            val data = WidgetDataStore.load(context)

            if (data == null) {
                // Show empty placeholder
                views.setViewVisibility(R.id.widget_empty_view, View.VISIBLE)
                views.setViewVisibility(R.id.widget_content_view, View.GONE)

                // Tapping anywhere in empty view opens MainActivity
                val appIntent = makeRouteIntent(context, "#home")
                views.setOnClickPendingIntent(R.id.widget_empty_view, appIntent)
                appWidgetManager.updateAppWidget(appWidgetId, views)
                return
            }

            // Show content view
            views.setViewVisibility(R.id.widget_empty_view, View.GONE)
            views.setViewVisibility(R.id.widget_content_view, View.VISIBLE)

            // 1. Days together
            val days = WidgetDataStore.getDays(context)
            views.setTextViewText(R.id.widget_days_text, "在一起第 $days 天")

            // 2. Partner name
            val partnerName = WidgetDataStore.getPartnerName(context)
            if (partnerName.isNotBlank()) {
                views.setTextViewText(R.id.widget_partner_name, partnerName)
                views.setViewVisibility(R.id.widget_partner_name, View.VISIBLE)
            } else {
                views.setViewVisibility(R.id.widget_partner_name, View.GONE)
            }

            // Click on days area opens #home
            views.setOnClickPendingIntent(
                R.id.widget_days_container,
                makeRouteIntent(context, "#home")
            )

            // 3. Quick BIBU button -> broadcast to WidgetActionReceiver
            val bibuIntent = Intent(context, WidgetActionReceiver::class.java).apply {
                action = WidgetActionReceiver.ACTION_BIBU
            }
            val bibuPending = PendingIntent.getBroadcast(
                context,
                0,
                bibuIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_bibu, bibuPending)

            // 4. Events countdown rows (up to 3)
            val events = WidgetDataStore.getEvents(context)
            val eventRowIds = listOf(
                Triple(R.id.widget_event_row_1, R.id.widget_event_1_title, R.id.widget_event_1_days),
                Triple(R.id.widget_event_row_2, R.id.widget_event_2_title, R.id.widget_event_2_days),
                Triple(R.id.widget_event_row_3, R.id.widget_event_3_title, R.id.widget_event_3_days)
            )

            val eventsPending = makeRouteIntent(context, "#events")
            views.setOnClickPendingIntent(R.id.widget_events_container, eventsPending)

            for (i in eventRowIds.indices) {
                val (rowId, titleId, daysId) = eventRowIds[i]
                if (i < events.size) {
                    val ev = events[i]
                    views.setViewVisibility(rowId, View.VISIBLE)
                    views.setTextViewText(titleId, ev.name)
                    views.setTextViewText(daysId, "还有 ${ev.daysRemaining} 天")
                } else {
                    views.setViewVisibility(rowId, View.GONE)
                }
            }

            // 5. Photos strip
            val photoFiles = WidgetPhotoCache.getCachedPhotoFiles(context)
            val photoViews = listOf(R.id.widget_photo_0, R.id.widget_photo_1, R.id.widget_photo_2)
            val photosPending = makeRouteIntent(context, "#photos")

            if (photoFiles.isNotEmpty()) {
                views.setViewVisibility(R.id.widget_photos_container, View.VISIBLE)
                for (i in photoViews.indices) {
                    val viewId = photoViews[i]
                    if (i < photoFiles.size) {
                        try {
                            val bmp = BitmapFactory.decodeFile(photoFiles[i].absolutePath)
                            if (bmp != null) {
                                views.setImageViewBitmap(viewId, bmp)
                                views.setViewVisibility(viewId, View.VISIBLE)
                            } else {
                                views.setViewVisibility(viewId, View.GONE)
                            }
                        } catch (_: Exception) {
                            views.setViewVisibility(viewId, View.GONE)
                        }
                    } else {
                        views.setViewVisibility(viewId, View.GONE)
                    }
                    views.setOnClickPendingIntent(viewId, photosPending)
                }
            } else {
                views.setViewVisibility(R.id.widget_photos_container, View.GONE)
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }

        private fun makeRouteIntent(context: Context, route: String): PendingIntent {
            val intent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
                putExtra("biboRoute", route)
            }
            val reqCode = route.hashCode()
            return PendingIntent.getActivity(
                context,
                reqCode,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
        }
    }
}

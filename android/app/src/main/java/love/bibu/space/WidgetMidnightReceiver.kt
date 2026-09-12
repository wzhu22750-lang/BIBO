package love.bibu.space

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import java.util.Calendar

class WidgetMidnightReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        Log.d(TAG, "Midnight refresh triggered")
        try {
            WidgetDataStore.recalculateAtMidnight(context)
            BibuWidgetProvider.updateAll(context)
        } catch (e: Exception) {
            Log.e(TAG, "Error during midnight recalculation", e)
        } finally {
            scheduleNextMidnight(context)
        }
    }

    companion object {
        private const val TAG = "WidgetMidnightReceiver"
        private const val REQUEST_CODE = 9120

        fun scheduleNextMidnight(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return

            val intent = Intent(context, WidgetMidnightReceiver::class.java).apply {
                action = "love.bibu.WIDGET_MIDNIGHT_ALARM"
            }
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            val pendingIntent = PendingIntent.getBroadcast(context, REQUEST_CODE, intent, flags)

            val calendar = Calendar.getInstance().apply {
                add(Calendar.DAY_OF_YEAR, 1)
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 5)
                set(Calendar.MILLISECOND, 0)
            }

            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setAndAllowWhileIdle(
                        AlarmManager.RTC_WAKEUP,
                        calendar.timeInMillis,
                        pendingIntent
                    )
                } else {
                    alarmManager.set(
                        AlarmManager.RTC_WAKEUP,
                        calendar.timeInMillis,
                        pendingIntent
                    )
                }
                Log.d(TAG, "Next midnight alarm scheduled for: ${calendar.time}")
            } catch (e: Exception) {
                Log.w(TAG, "Failed to schedule midnight alarm", e)
            }
        }

        fun cancelMidnight(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
            val intent = Intent(context, WidgetMidnightReceiver::class.java).apply {
                action = "love.bibu.WIDGET_MIDNIGHT_ALARM"
            }
            val flags = PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
            val pendingIntent = PendingIntent.getBroadcast(context, REQUEST_CODE, intent, flags)
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }
        }
    }
}

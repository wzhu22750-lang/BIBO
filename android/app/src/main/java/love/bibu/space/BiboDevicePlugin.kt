package love.bibu.space

import android.app.AppOpsManager
import android.app.usage.UsageStatsManager
import android.app.usage.UsageEvents
import android.net.Uri
import android.provider.Settings
import java.util.Calendar
import java.util.TimeZone
import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.google.firebase.FirebaseApp
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.PermissionState
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback

@CapacitorPlugin(name = "BiboDevice", permissions = [Permission(alias = "notifications", strings = [Manifest.permission.POST_NOTIFICATIONS])])
class BiboDevicePlugin : Plugin() {
    private val channel = "bibo_love_v1"
    private fun result() = JSObject().put("supported", true)
    private fun permission() = result().put("granted", NotificationManagerCompat.from(context).areNotificationsEnabled())
    private fun safeRoute(raw: String?): String {
        return if (raw != null && DeepLinkPolicy.validHash(raw)) raw else "#home"
    }
    private fun routeFromIntent(intent: Intent): String? {
        return DeepLinkPolicy.route(intent, context.getString(love.bibu.space.R.string.custom_url_scheme))
    }
    @PluginMethod fun notificationPermission(call: PluginCall) { call.resolve(permission()) }
    @PluginMethod fun requestNotificationPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "notificationPermissionResult")
        } else call.resolve(permission())
    }
    @PermissionCallback private fun notificationPermissionResult(call: PluginCall) { call.resolve(permission()) }
    @PluginMethod fun notify(call: PluginCall) {
        val id = call.getInt("id") ?: 0
        if (id < 1) { call.reject("Invalid notification id"); return }
        if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) { call.reject("请先开启 Android 系统通知权限"); return }
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(NotificationChannel(channel, "两个人的哔卟", NotificationManager.IMPORTANCE_DEFAULT))
        if (Build.VERSION.SDK_INT >= 26 && manager.getNotificationChannel(channel).importance == NotificationManager.IMPORTANCE_NONE) { call.reject("请在系统设置中开启哔卟通知渠道"); return }
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("biboRoute", safeRoute(call.getString("route")))
        }
        val pending = PendingIntent.getActivity(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val notification = NotificationCompat.Builder(context, channel)
            .setSmallIcon(love.bibu.space.R.drawable.ic_stat_bibo)
            .setContentTitle((call.getString("title") ?: "BIBO").take(80))
            .setContentText((call.getString("body") ?: "收到一个小小的想念").take(240))
            .setContentIntent(pending).setAutoCancel(true).build()
        try { manager.notify(id, notification); call.resolve(result()) }
        catch (error: SecurityException) { call.reject("系统通知权限已被撤销", error) }
    }
    @PluginMethod fun vibrate(call: PluginCall) {
        try {
            val values = call.getArray("pattern") ?: throw IllegalArgumentException("Missing pattern")
            require(values.length() in 1..20)
            val durations = LongArray(values.length()) { values.getLong(it) }
            require(durations.all { it in 0..1000 } && durations.sum() <= 5000)
            val vibrator = context.getSystemService(Context.VIBRATOR_SERVICE) as Vibrator
            if (!vibrator.hasVibrator()) { call.resolve(JSObject().put("supported", false).put("reason", "设备没有震动器")); return }
            // Web pattern starts with vibration; Android waveform starts with an initial delay.
            val waveform = longArrayOf(0) + durations
            if (Build.VERSION.SDK_INT >= 26) vibrator.vibrate(VibrationEffect.createWaveform(waveform, -1))
            else { @Suppress("DEPRECATION") vibrator.vibrate(waveform, -1) }
            call.resolve(result())
        } catch(error: Exception) { call.reject("无法触发震动", error) }
    }
    private fun usageGranted(): Boolean {
        val ops = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = if (Build.VERSION.SDK_INT >= 29) ops.unsafeCheckOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName)
            else { @Suppress("DEPRECATION") ops.checkOpNoThrow(AppOpsManager.OPSTR_GET_USAGE_STATS, android.os.Process.myUid(), context.packageName) }
        return mode == AppOpsManager.MODE_ALLOWED
    }
    @PluginMethod fun usagePermission(call: PluginCall) { call.resolve(result().put("granted", usageGranted())) }
    @PluginMethod fun openUsageSettings(call: PluginCall) {
        try {
            val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply { data = Uri.parse("package:" + context.packageName) }
            activity.startActivity(intent)
            // Opening Settings is not a permission grant. Recheck on foreground.
            call.resolve(result())
        } catch(error: Exception) { call.reject("无法打开使用情况访问设置，请在系统设置中查找 BIBO", error) }
    }
    @PluginMethod fun screenTimeToday(call: PluginCall) {
        val target = call.getString("packageName")
        if(target != null && !Regex("^[A-Za-z][A-Za-z0-9_]*(\\.[A-Za-z0-9_]+)+$").matches(target)) { call.reject("App 包名无效"); return }
        if(!usageGranted()) { call.resolve(result().put("granted", false).put("milliseconds", org.json.JSONObject.NULL).put("reason", "尚未授予使用情况访问权限")); return }
        if(target == null && Build.VERSION.SDK_INT < 28) { call.resolve(JSObject().put("supported", false).put("granted", true).put("milliseconds", org.json.JSONObject.NULL).put("reason", "屏幕交互事件需要 Android 9 或更新版本")); return }
        // Query outside the UI thread and clip a lookback event stream to midnight in device timezone.
        bridge.execute {
            try {
                val end = System.currentTimeMillis()
                val day = Calendar.getInstance().apply { timeInMillis=end; set(Calendar.HOUR_OF_DAY,0); set(Calendar.MINUTE,0); set(Calendar.SECOND,0); set(Calendar.MILLISECOND,0) }
                val start = day.timeInMillis
                val from = (day.clone() as Calendar).apply { add(Calendar.DAY_OF_MONTH,-2) }.timeInMillis
                val manager = context.getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
                val events = manager.queryEvents(from, end)
                val window = UsageWindow(start,end,target)
                if(events != null) {
                    val event = UsageEvents.Event()
                    while(events.hasNextEvent()) {
                        events.getNextEvent(event)
                        window.accept(event.timeStamp,event.eventType,event.packageName,event.className)
                    }
                }
                if(!usageGranted()) { call.reject("使用情况访问权限已撤销，请重新授权"); return@execute }
                val value = if(window.observed) window.finish() else org.json.JSONObject.NULL
                call.resolve(result().put("granted",true).put("milliseconds",value)
                    .put("from",start).put("to",end).put("timezone",TimeZone.getDefault().id)
                    .put("metric",if(target == null) "screen_interactive" else "app_foreground")
                    .put("reason",if(window.observed) "根据设备保留的事件估算；多窗口、系统截断或遗漏可能影响结果" else "系统未返回可用于计算的事件；不等于零使用量"))
            } catch(error: Exception) { call.reject("无法读取设备使用记录", error) }
        }
    }
    @PluginMethod fun firebaseConfiguration(call: PluginCall) {
        call.resolve(result().put("configured", FirebaseApp.getApps(context).isNotEmpty()))
    }
    @PluginMethod fun scheduleReminder(call: PluginCall) {
        try {
            val row=org.json.JSONObject().put("id",call.getInt("id") ?: 0).put("at",call.getLong("at") ?: 0)
                .put("title",(call.getString("title") ?: "BIBO 提醒").take(80))
                .put("body",(call.getString("body") ?: "记得你的小约定").take(240))
                .put("route",safeRoute(call.getString("route")))
            BiboReminders.schedule(context,row)
            call.resolve(result().put("reason","已保存为非精确定时提醒，系统可能延后"))
        } catch(error:Exception) {call.reject(error.message ?: "无法设置提醒",error)}
    }
    @PluginMethod fun cancelReminder(call: PluginCall) {
        try { BiboReminders.cancel(context,call.getInt("id") ?: 0);call.resolve(result()) }
        catch(error:Exception) {call.reject("取消提醒失败",error)}
    }
    @PluginMethod fun listReminders(call: PluginCall) {
        try {call.resolve(result().put("items",org.json.JSONArray(BiboReminders.rows(context))))}
        catch(error:Exception) {call.reject("读取提醒失败",error)}
    }
    @PluginMethod fun launchRoute(call: PluginCall) {
        val route = routeFromIntent(activity.intent)
        activity.intent.removeExtra("biboRoute")
        activity.intent.removeExtra("route")
        activity.intent.data = null
        call.resolve(if(route == null) JSObject() else JSObject().put("route", safeRoute(route)))
    }
    override fun handleOnNewIntent(intent: Intent) {
        super.handleOnNewIntent(intent)
        val route = routeFromIntent(intent) ?: return
        intent.removeExtra("biboRoute")
        intent.data = null
        notifyListeners("deepLink", JSObject().put("route", safeRoute(route)), true)
    }
}

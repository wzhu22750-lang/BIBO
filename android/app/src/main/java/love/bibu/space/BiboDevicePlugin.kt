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
import android.content.pm.PackageManager
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.PermissionState
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.getcapacitor.annotation.PermissionCallback
import com.igexin.sdk.PushManager

@CapacitorPlugin(name = "BiboDevice", permissions = [Permission(alias = "notifications", strings = [Manifest.permission.POST_NOTIFICATIONS])])
class BiboDevicePlugin : Plugin() {
    private val channel = "bibo_love_v3"
    private val messageChannel = "bibo_messages_v2"
    override fun load() {
        // Create push channels as early as the bridge exists so a GeTui
        // notification arriving later (even after process death and relaunch)
        // lands on the right channel instead of the system "Miscellaneous" one.
        ensureChannels(context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
        // CID 就绪时通知 WebView（设备注册由前端 listenRegistration 监听）。
        BibuPushState.onCid { cid -> notifyListeners("pushCid", JSObject().put("token", cid), true) }
    }
    private fun ensureChannels(manager: NotificationManager) {
        if (Build.VERSION.SDK_INT < 26) return
        val pings = NotificationChannel(channel, "两个人的哔卟", NotificationManager.IMPORTANCE_HIGH).apply {
            description = "情侣 Ping 实时通知"
            setLockscreenVisibility(android.app.Notification.VISIBILITY_PRIVATE)
            enableVibration(true)
        }
        manager.createNotificationChannel(pings)
        // Chat messages: heads-up banner with the system default sound and
        // vibration. Importance/sound/vibration are owned by Android after the
        // user first sees the channel; we never bypass DND or silent mode.
        val messages = NotificationChannel(messageChannel, "BIBU！悄悄话", NotificationManager.IMPORTANCE_HIGH).apply {
            description = "伴侣消息通知"
            setLockscreenVisibility(android.app.Notification.VISIBILITY_PRIVATE)
            enableVibration(true)
        }
        manager.createNotificationChannel(messages)
    }
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
        ensureChannels(manager)
        val target = if (call.getString("channel") == "messages") messageChannel else channel
        if (Build.VERSION.SDK_INT >= 26 && manager.getNotificationChannel(target).importance == NotificationManager.IMPORTANCE_NONE) { call.reject("请在系统设置中开启哔卟通知渠道"); return }
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("biboRoute", safeRoute(call.getString("route")))
        }
        val pending = PendingIntent.getActivity(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val notification = NotificationCompat.Builder(context, target)
            .setSmallIcon(love.bibu.space.R.drawable.ic_stat_bibo)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setContentTitle((call.getString("title") ?: "BIBU！").take(80))
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
        } catch(error: Exception) { call.reject("无法打开使用情况访问设置，请在系统设置中查找 BIBU！", error) }
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
    @PluginMethod fun pushReady(call: PluginCall) {
        call.resolve(result().put("configured", getuiAppId().isNotBlank()))
    }
    private fun getuiAppId(): String =
        try {
            context.packageManager
                .getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
                .metaData?.getString("GETUI_APPID").orEmpty()
        } catch (_: Exception) {
            ""
        }
    /**
     * 个推初始化必须先于读取 CID。CID 是持久化标识，不代表当前长连接已经启动。
     * 尤其是进程被系统杀死后，不能因为读到了缓存 CID 就跳过 initialize。
     * 关键：若此前曾调用过 turnOffPush（如退出登录、注销），个推会把关闭状态持久化在本地。
     * 重新初始化时必须显式调用 turnOnPush 唤醒长连接通道，否则 SDK 绝不建连。
     */
    private fun ensurePushInitialized() {
        val app = context.applicationContext
        val pm = PushManager.getInstance()
        // 恢复推送总开关（避免因注销或卸载残留导致 SDK 持久化处于 turnOffPush 状态）
        try {
            pm.turnOnPush(app)
        } catch (_: Exception) {
        }
        // initialize() 会从 Manifest 发现 BibuGTIntentService；显式注册可避免
        // SDK/Manifest 扫描差异导致回调服务没有被绑定。
        pm.registerPushIntentService(app, BibuGTIntentService::class.java)
        pm.initialize(app)
    }

    @PluginMethod fun pushRegistration(call: PluginCall) {
        bridge.execute {
            try {
                ensurePushInitialized()
                val pm = PushManager.getInstance()
                val cached = BibuPushState.cid ?: pm.getClientid(context.applicationContext)
                if (!cached.isNullOrBlank()) {
                    BibuPushState.setCid(cached)
                    call.resolve(result().put("token", cached))
                    return@execute
                }
                // CID 尚未就绪：等待 GTIntentService 回调（前端侧带超时）。
                BibuPushState.onCid { cid -> call.resolve(result().put("token", cid)) }
            } catch (error: Exception) {
                call.reject("个推 SDK 初始化失败", error)
            }
        }
    }

    @PluginMethod fun getPushDiagnostics(call: PluginCall) {
        bridge.execute {
            val app = context.applicationContext
            val pm = PushManager.getInstance()
            try {
                ensurePushInitialized()
                // 该方法是异步把查询请求交给 pushservice；真实状态仍会通过
                // onReceiveOnlineState 回调回传。不要把缓存 CID 当成在线状态。
                pm.queryPushOnLine(app)
            } catch (error: Exception) {
                // 忽略非关键异常
            }
            val cid = pm.getClientid(app) ?: BibuPushState.cid ?: ""
            val notificationsEnabled = androidx.core.app.NotificationManagerCompat
                .from(app).areNotificationsEnabled()
            val ret = JSObject()
            ret.put("cid", cid)
            ret.put("isPushOnline", BibuPushState.isOnline ?: false)
            ret.put("notificationsEnabled", notificationsEnabled)
            ret.put("sdkVersion", "3.3.15.0")
            ret.put("deviceModel", "${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}")
            ret.put("androidVersion", "Android ${android.os.Build.VERSION.RELEASE} (API ${android.os.Build.VERSION.SDK_INT})")
            call.resolve(ret)
        }
    }
    @PluginMethod fun pushUnregister(call: PluginCall) {
        try {
            // 个推 SDK 无 stopPushService，关闭收消息用 turnOffPush（再登录时 turnOnPush 恢复）
            PushManager.getInstance().turnOffPush(context.applicationContext)
        } catch (_: Exception) {
            // SDK 未初始化时关闭会抛异常，忽略即可
        }
        BibuPushState.clear()
        call.resolve(result())
    }
    @PluginMethod fun scheduleReminder(call: PluginCall) {
        try {
            val row=org.json.JSONObject().put("id",call.getInt("id") ?: 0).put("at",call.getLong("at") ?: 0)
                .put("title",(call.getString("title") ?: "BIBU！提醒").take(80))
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
        // Do not consume an unknown data URI here: the same Activity also
        // carries Supabase PKCE auth callbacks, which are handled by the
        // Capacitor App plugin. Only clear an intent once it is proven to be
        // an internal navigation/notification route.
        if (route != null) activity.intent.data = null
        call.resolve(if(route == null) JSObject() else JSObject().put("route", safeRoute(route)))
    }
    override fun handleOnNewIntent(intent: Intent) {
        super.handleOnNewIntent(intent)
        val route = routeFromIntent(intent) ?: return
        intent.removeExtra("biboRoute")
        intent.removeExtra("route")
        intent.data = null
        notifyListeners("deepLink", JSObject().put("route", safeRoute(route)), true)
    }
}

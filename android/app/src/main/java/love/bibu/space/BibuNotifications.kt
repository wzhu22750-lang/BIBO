package love.bibu.space

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

/**
 * BIBU 通知渲染的唯一出口（与历史行为一致）：
 * - 渠道：pings 走 bibo_love_v3，聊天走 bibo_messages_v2，由 [post] 统一分配；
 * - 图标：ic_stat_bibo（像素风小图标）；
 * - 点击：MainActivity + biboRoute extra → DeepLinkPolicy → WebView 深链。
 *
 * 本地提醒（BiboReminders / JS notify）与个推透传（BibuGTIntentService）均走这里，
 * 保证进程被杀后由 pushservice 进程渲染的通知与前台渲染的完全一致。
 */
object BibuNotifications {
    const val PING_CHANNEL = "bibo_love_v3"
    const val MESSAGE_CHANNEL = "bibo_messages_v2"

    fun ensureChannels(context: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.createNotificationChannel(
            NotificationChannel(PING_CHANNEL, "两个人的哔卟", NotificationManager.IMPORTANCE_HIGH).apply {
                description = "情侣 Ping 实时通知"
                setLockscreenVisibility(android.app.Notification.VISIBILITY_PRIVATE)
                enableVibration(true)
            },
        )
        manager.createNotificationChannel(
            NotificationChannel(
                MESSAGE_CHANNEL,
                "BIBU！悄悄话",
                NotificationManager.IMPORTANCE_HIGH,
            ).apply {
                description = "伴侣消息通知"
                setLockscreenVisibility(android.app.Notification.VISIBILITY_PRIVATE)
                enableVibration(true)
            },
        )
    }

    /** OS 级通知总开关（API 33+ 需要运行时授权，之前恒为 true）。 */
    fun enabled(context: Context): Boolean =
        NotificationManagerCompat.from(context).areNotificationsEnabled()

    /**
     * 渲染一条 BIBU 系统通知。静默失败（权限/渠道被关闭）以便后台服务调用。
     */
    fun post(
        context: Context,
        id: Int,
        kind: String?,
        title: String,
        body: String,
        route: String,
    ) {
        ensureChannels(context)
        if (!enabled(context)) return
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val target = if (kind == "message") MESSAGE_CHANNEL else PING_CHANNEL
        if (Build.VERSION.SDK_INT >= 26 &&
            manager.getNotificationChannel(target).importance == NotificationManager.IMPORTANCE_NONE
        ) {
            return
        }
        val safeRoute = if (DeepLinkPolicy.validHash(route)) route else "#home"
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("biboRoute", safeRoute)
        }
        val pending =
            PendingIntent.getActivity(
                context,
                id,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
            )
        val notification =
            NotificationCompat.Builder(context, target)
                .setSmallIcon(R.drawable.ic_stat_bibo)
                .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
                .setContentTitle(title.take(80))
                .setContentText(body.take(240))
                .setContentIntent(pending)
                .setAutoCancel(true)
                .build()
        try {
            manager.notify(id, notification)
        } catch (_: SecurityException) {
            // 权限在授权后被系统吊销：静默忽略
        }
    }
}
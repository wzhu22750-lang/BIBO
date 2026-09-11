package love.bibu.space

import android.content.Context
import com.igexin.sdk.GTIntentService
import com.igexin.sdk.PushManager
import com.igexin.sdk.message.GTCmdMessage
import com.igexin.sdk.message.GTNotificationMessage
import com.igexin.sdk.message.GTTransmitMessage
import org.json.JSONObject

/**
 * 个推消息桥接服务（主进程）。职责：
 *  - 接收 CID，写入 [BibuPushState]（供插件转发给 WebView 注册）；
 *  - 接收透传消息（JSON：kind / title / body / route / message_id|ping_id），
 *    统一由 [BibuNotifications] 渲染系统通知；点击后 MainActivity 深链回 WebView。
 *
 * 进程被杀时，透传消息由 pushservice 进程触发本服务，仍可弹出通知。
 */
class BibuGTIntentService : GTIntentService() {
    override fun onReceiveServicePid(context: Context?, pid: Int) = Unit

    override fun onReceiveClientId(context: Context?, clientid: String?) {
        if (!clientid.isNullOrBlank()) BibuPushState.setCid(clientid)
    }

    override fun onReceiveOnlineState(context: Context?, online: Boolean) {
        android.util.Log.i(TAG, "Online state changed: $online")
        BibuPushState.setOnline(online)
    }

    override fun onReceiveMessageData(context: Context?, msg: GTTransmitMessage?) {
        val ctx = context ?: return
        // 回执给个推（actionid 90001：应用收到）。失败不影响业务。
        runCatching {
            PushManager.getInstance()
                .sendFeedbackMessage(ctx, msg?.taskId, msg?.messageId, 90001)
        }
        val payload = msg?.payload ?: return
        val rawString = String(payload, Charsets.UTF_8).trim()
        if (rawString.isEmpty()) return

        val data = runCatching { JSONObject(rawString) }.getOrNull()
        val kind = data?.optString("kind", "ping") ?: "ping"
        val route = data?.optString("route", "#home")?.ifBlank { "#home" } ?: "#home"
        val targetRoute = if (DeepLinkPolicy.validHash(route)) route else "#home"
        val title = data?.optString("title", "BIBU！")?.ifBlank { "BIBU！" } ?: "BIBU！"
        val body = data?.optString("body")?.ifBlank { null }
            ?: (if (data == null) rawString else "收到一个小小的想念")
        val idRaw = (if (kind == "message") data?.optString("message_id") else data?.optString("ping_id"))
            ?.ifBlank { null }
            ?: msg?.messageId
            ?: msg?.taskId
            ?: java.util.UUID.randomUUID().toString()

        val notificationId = ("bibu:" + idRaw).hashCode() and 0x7fffffff
        BibuNotifications.post(ctx, notificationId, kind, title, body, targetRoute)
    }

    override fun onNotificationMessageArrived(context: Context?, message: GTNotificationMessage?) {
        android.util.Log.i(TAG, "Notification arrived: ${message?.messageId}")
    }

    override fun onNotificationMessageClicked(context: Context?, message: GTNotificationMessage?) {
        val ctx = context ?: return
        val intent = android.content.Intent(ctx, MainActivity::class.java).apply {
            flags = android.content.Intent.FLAG_ACTIVITY_NEW_TASK or android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("biboRoute", "#home")
        }
        ctx.startActivity(intent)
    }

    override fun onReceiveCommandResult(context: Context?, cmdMessage: GTCmdMessage?) = Unit
}
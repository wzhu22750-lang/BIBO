package love.bibu.space

import android.content.Intent

object DeepLinkPolicy {
    private val pages = setOf("home", "chat", "events", "photos", "focus", "settings")
    private val ids = Regex("[A-Za-z0-9_-]{1,80}")

    fun route(intent: Intent, scheme: String): String? {
        val explicit = intent.getStringExtra("biboRoute")
        if (explicit != null) return if (validHash(explicit)) explicit else "#home"
        val data = intent.data
        if (data != null)
            return dataRoute(data.scheme, data.host, data.path, data.getQueryParameter("message"), data.getQueryParameter("event"), scheme)
        // FCM notification click on a cold-started process: the Capacitor PushNotifications
        // plugin replays only messages received while running, so the launch intent here
        // carries the push data as extras (route/ping_id/kind) plus google.message_id and
        // no data URI. Treat it as a navigation only when it looks like an FCM click intent.
        return fcmClickRoute(intent.getStringExtra("google.message_id"), intent.getStringExtra("route"))
    }

    fun fcmClickRoute(messageId: String?, route: String?): String? {
        if (messageId == null || route == null) return null
        return if (validHash(route)) route else "#home"
    }

    fun dataRoute(scheme: String?, host: String?, path: String?, message: String?, event: String?, expectedScheme: String): String? {
        if (scheme != expectedScheme || host !in pages || !path.isNullOrEmpty()) return null
        val page = host!!
        val key = when (page) { "chat" -> "message"; "events" -> "event"; else -> null }
        if (key == null) return "#$page"
        val value = if (key == "message") message else event
        return if (value != null && ids.matches(value)) "#$page?$key=$value" else "#$page"
    }

    fun validHash(value: String): Boolean = Regex("^#(home|chat|events|photos|focus|settings)(\\?(message|event)=[A-Za-z0-9_-]{1,80})?$").matches(value)
}

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
            return dataRoute(data.scheme, data.host, data.path, data.getQueryParameter("message"), data.getQueryParameter("event"), data.getQueryParameter("action"), scheme)
        // 兼容第三方或推送附加 extras 中的 route
        return pushClickRoute(intent.getStringExtra("route"))
    }

    fun pushClickRoute(route: String?): String? {
        if (route == null) return null
        return if (validHash(route)) route else "#home"
    }

    fun dataRoute(scheme: String?, host: String?, path: String?, message: String?, event: String?, action: String?, expectedScheme: String): String? {
        if (scheme != expectedScheme || host !in pages || !path.isNullOrEmpty()) return null
        val page = host!!
        val key = when (page) { "chat" -> "message"; "events" -> "event"; "home" -> "action"; else -> null }
        if (key == null) return "#$page"
        val value = when (key) {
            "message" -> message
            "event" -> event
            "action" -> action
            else -> null
        }
        return if (value != null && ids.matches(value)) "#$page?$key=$value" else "#$page"
    }

    fun dataRoute(scheme: String?, host: String?, path: String?, message: String?, event: String?, expectedScheme: String): String? {
        return dataRoute(scheme, host, path, message, event, null, expectedScheme)
    }

    fun validHash(value: String): Boolean = Regex("^#(home|chat|events|photos|focus|settings)(\\?(message|event|action)=[A-Za-z0-9_-]{1,80})?$").matches(value)
}

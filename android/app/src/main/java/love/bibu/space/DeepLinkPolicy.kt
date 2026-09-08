package love.bibu.space

import android.content.Intent

object DeepLinkPolicy {
    private val pages = setOf("home", "chat", "events", "photos", "focus", "settings")
    private val ids = Regex("[A-Za-z0-9_-]{1,80}")

    fun route(intent: Intent, scheme: String): String? {
        val explicit = intent.getStringExtra("biboRoute")
        if (explicit != null) return if (validHash(explicit)) explicit else "#home"
        val data = intent.data ?: return null
        return dataRoute(data.scheme, data.host, data.path, data.getQueryParameter("message"), data.getQueryParameter("event"), scheme)
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

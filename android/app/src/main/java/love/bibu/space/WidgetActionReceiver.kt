package love.bibu.space

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log
import android.widget.Toast
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

class WidgetActionReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action
        if (action != ACTION_BIBU) {
            return
        }

        if (!throttle.tryAcquire()) {
            Log.d(TAG, "ACTION_BIBU ignored due to throttle")
            return
        }

        val pendingResult = goAsync()
        CoroutineScope(Dispatchers.IO).launch {
            try {
                handleBibuClick(context)
            } finally {
                pendingResult.finish()
            }
        }
    }

    private suspend fun handleBibuClick(context: Context) {
        val supabaseUrl = WidgetDataStore.getSupabaseUrl(context)
        val anonKey = WidgetDataStore.getAnonKey(context)
        val accessToken = WidgetDataStore.getAccessToken(context)

        if (supabaseUrl.isBlank() || anonKey.isBlank() || accessToken.isNullOrBlank()) {
            Log.w(TAG, "Missing credentials, falling back to launching app")
            fallbackToApp(context)
            return
        }

        val success = postSendPing(supabaseUrl, anonKey, accessToken)
        if (success) {
            withContext(Dispatchers.Main) {
                Toast.makeText(context, "哔卟已发送 ♥", Toast.LENGTH_SHORT).show()
            }
        } else {
            Log.w(TAG, "Send ping RPC failed, fallback to launching app")
            fallbackToApp(context)
        }
    }

    private fun postSendPing(supabaseUrl: String, anonKey: String, accessToken: String): Boolean {
        return try {
            val endpoint = supabaseUrl.trimEnd('/') + "/rest/v1/rpc/send_ping"
            val url = URL(endpoint)
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 7000
                readTimeout = 7000
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("apikey", anonKey)
                setRequestProperty("Authorization", "Bearer $accessToken")
            }

            val body = JSONObject().apply {
                put("ping_kind", "哔卟哔卟")
            }.toString()

            OutputStreamWriter(conn.outputStream).use { writer ->
                writer.write(body)
                writer.flush()
            }

            val responseCode = conn.responseCode
            conn.disconnect()
            responseCode in 200..299
        } catch (e: Exception) {
            Log.e(TAG, "Network error sending ping RPC", e)
            false
        }
    }

    private fun fallbackToApp(context: Context) {
        val launchIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
            putExtra("biboRoute", "#home?action=bibu")
        }
        context.startActivity(launchIntent)
    }

    companion object {
        const val ACTION_BIBU = "love.bibu.WIDGET_BIBU"
        private const val TAG = "WidgetActionReceiver"
        val throttle = WidgetClickThrottle()
    }
}

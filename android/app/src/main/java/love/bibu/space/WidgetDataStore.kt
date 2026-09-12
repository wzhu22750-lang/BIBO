package love.bibu.space

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.TimeZone

data class WidgetEventItem(
    val id: String,
    val name: String,
    val targetAt: String,
    val yearly: Boolean,
    val daysRemaining: Int
)

object WidgetDataStore {
    private const val PREFS_NAME = "bibu_widget"
    private const val KEY_DATA = "data"
    private const val KEY_LAST_SYNC = "last_sync"

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun save(context: Context, json: JSONObject) {
        prefs(context).edit()
            .putString(KEY_DATA, json.toString())
            .putLong(KEY_LAST_SYNC, System.currentTimeMillis())
            .apply()
    }

    fun load(context: Context): JSONObject? {
        val raw = prefs(context).getString(KEY_DATA, null) ?: return null
        return try {
            JSONObject(raw)
        } catch (_: Exception) {
            null
        }
    }

    fun clear(context: Context) {
        prefs(context).edit().clear().apply()
    }

    fun getDays(context: Context): Int {
        val obj = load(context) ?: return 0
        return obj.optInt("days", 0)
    }

    fun getPartnerName(context: Context): String {
        val obj = load(context) ?: return ""
        return obj.optString("partnerName", "")
    }

    fun getTogetherSince(context: Context): String? {
        val obj = load(context) ?: return null
        val str = obj.optString("togetherSince", "")
        return if (str.isNotBlank()) str else null
    }

    fun getEvents(context: Context): List<WidgetEventItem> {
        val obj = load(context) ?: return emptyList()
        val arr = obj.optJSONArray("events") ?: return emptyList()
        val result = mutableListOf<WidgetEventItem>()
        for (i in 0 until arr.length()) {
            val item = arr.optJSONObject(i) ?: continue
            val id = item.optString("id", i.toString())
            val name = item.optString("name", "")
            val targetAt = item.optString("targetAt", "")
            val yearly = item.optBoolean("yearly", false)
            val days = item.optInt("daysRemaining", 0)
            if (name.isNotBlank()) {
                result.add(WidgetEventItem(id, name, targetAt, yearly, days))
            }
        }
        return result
    }

    fun getPhotoUrls(context: Context): List<String> {
        val obj = load(context) ?: return emptyList()
        val arr = obj.optJSONArray("photoUrls") ?: return emptyList()
        val result = mutableListOf<String>()
        for (i in 0 until arr.length()) {
            val url = arr.optString(i, "")
            if (url.isNotBlank()) {
                result.add(url)
            }
        }
        return result
    }

    fun getSupabaseUrl(context: Context): String {
        return load(context)?.optString("supabaseUrl", "") ?: ""
    }

    fun getAnonKey(context: Context): String {
        return load(context)?.optString("anonKey", "") ?: ""
    }

    fun getAccessToken(context: Context): String? {
        val token = load(context)?.optString("accessToken", "")
        return if (token.isNullOrBlank()) null else token
    }

    /**
     * Recalculate days count and event countdowns for midnight refresh.
     * Updates stored JSON and returns true if changes occurred.
     */
    fun recalculateAtMidnight(context: Context): Boolean {
        val obj = load(context) ?: return false
        val togetherSince = obj.optString("togetherSince", "")
        val eventsArr = obj.optJSONArray("events")

        val todayCal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }
        val today = todayCal.time

        // 1. Recalculate together days
        if (togetherSince.isNotBlank()) {
            val days = calcTogetherDays(togetherSince, today)
            if (days >= 0) {
                obj.put("days", days)
            }
        }

        // 2. Recalculate events
        if (eventsArr != null) {
            val newEvents = JSONArray()
            for (i in 0 until eventsArr.length()) {
                val ev = eventsArr.optJSONObject(i) ?: continue
                val targetAt = ev.optString("targetAt", "")
                val yearly = ev.optBoolean("yearly", false)
                if (targetAt.isNotBlank()) {
                    val remaining = calcDaysUntil(targetAt, yearly, todayCal)
                    ev.put("daysRemaining", remaining)
                }
                newEvents.put(ev)
            }
            obj.put("events", newEvents)
        }

        save(context, obj)
        return true
    }

    fun calcTogetherDays(sinceDateStr: String, now: Date = Date()): Int {
        val df = SimpleDateFormat("yyyy-MM-dd", Locale.CHINA).apply {
            timeZone = TimeZone.getDefault()
        }
        return try {
            val start = df.parse(sinceDateStr.take(10)) ?: return 0
            val startCal = Calendar.getInstance().apply {
                time = start
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            val nowCal = Calendar.getInstance().apply {
                time = now
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }
            val diffMs = nowCal.timeInMillis - startCal.timeInMillis
            val days = (diffMs / (1000 * 60 * 60 * 24)).toInt()
            // In BIBU: 00:00 on the day is day 1, so if start == today, days = 1 (or days + 1)
            // Checking Web implementation: days = Math.floor((now - start) / 86400000) + 1
            if (days >= 0) days + 1 else 0
        } catch (_: Exception) {
            0
        }
    }

    fun calcDaysUntil(targetDateStr: String, yearly: Boolean, nowCal: Calendar = Calendar.getInstance()): Int {
        val df = SimpleDateFormat("yyyy-MM-dd", Locale.CHINA).apply {
            timeZone = TimeZone.getDefault()
        }
        return try {
            val target = df.parse(targetDateStr.take(10)) ?: return 0
            val targetCal = Calendar.getInstance().apply {
                time = target
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }

            val today = Calendar.getInstance().apply {
                time = nowCal.time
                set(Calendar.HOUR_OF_DAY, 0)
                set(Calendar.MINUTE, 0)
                set(Calendar.SECOND, 0)
                set(Calendar.MILLISECOND, 0)
            }

            if (yearly) {
                targetCal.set(Calendar.YEAR, today.get(Calendar.YEAR))
                if (targetCal.before(today)) {
                    targetCal.add(Calendar.YEAR, 1)
                }
            }

            val diffMs = targetCal.timeInMillis - today.timeInMillis
            val days = (diffMs / (1000 * 60 * 60 * 24)).toInt()
            if (days < 0) 0 else days
        } catch (_: Exception) {
            0
        }
    }
}

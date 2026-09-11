package love.bibu.space

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import org.json.JSONObject

object BiboReminders {
    private const val CHANNEL = "bibo_reminders_v1"
    private fun store(context: Context) = context.getSharedPreferences("bibo_reminders", Context.MODE_PRIVATE)
    private fun alarm(context: Context) = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    private fun pending(context: Context, id: Int) = PendingIntent.getBroadcast(context, id,
        Intent(context, BiboReminderReceiver::class.java).setAction("love.bibu.REMINDER").putExtra("id", id),
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
    fun available(context: Context): Boolean {
        if(!NotificationManagerCompat.from(context).areNotificationsEnabled()) return false
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if(Build.VERSION.SDK_INT >= 26) {
            manager.createNotificationChannel(NotificationChannel(CHANNEL,"本机约定提醒",NotificationManager.IMPORTANCE_DEFAULT))
            if(manager.getNotificationChannel(CHANNEL).importance == NotificationManager.IMPORTANCE_NONE) return false
        }
        return true
    }
    @Synchronized fun schedule(context: Context, row: JSONObject) {
        val id=row.getInt("id"); val at=row.getLong("at")
        require(ReminderPolicy.valid(id,at,System.currentTimeMillis())) {"请选择未来一年内的提醒时间"}
        require(available(context)) {"请先开启通知权限及本机约定提醒渠道"}
        val prefs=store(context)
        require(prefs.contains(id.toString()) || prefs.all.size<64) {"最多保留 64 个本机提醒"}
        // Fail closed: a saved record exists before the system can dispatch the alarm.
        check(prefs.edit().putString(id.toString(),row.put("status","scheduled").toString()).commit()) {"无法保存提醒"}
        try { alarm(context).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,at,pending(context,id)) }
        catch(error: Exception) { status(context,id,row,"failed"); throw error }
    }
    @Synchronized fun cancel(context: Context,id:Int) {
        // Remove first: even a racing broadcast cannot display a canceled record.
        check(store(context).edit().remove(id.toString()).commit()) {"无法删除提醒"}
        alarm(context).cancel(pending(context,id))
        (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).cancel("reminder",id)
    }
    @Synchronized fun rows(context: Context): List<JSONObject> = store(context).all.values.mapNotNull {
        try { JSONObject(it as String) } catch(_: Exception) { null }
    }.sortedBy { it.optLong("at") }
    private fun status(context:Context,id:Int,row:JSONObject,value:String) {
        check(store(context).edit().putString(id.toString(),row.put("status",value).toString()).commit()) {"无法保存提醒状态"}
    }
    @Synchronized fun deliver(context: Context,id:Int) {
        val saved=store(context).getString(id.toString(),null) ?: return
        val row=JSONObject(saved)
        if(row.optString("status")!="scheduled") return
        val now=System.currentTimeMillis()
        if(row.getLong("at")>now) { restore(context);return }
        if(ReminderPolicy.expired(row.getLong("at"),now)) { status(context,id,row,"expired");return }
        if(!available(context)) { status(context,id,row,"blocked");return }
        val intent=Intent(context,MainActivity::class.java).apply {
            flags=Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("biboRoute",row.optString("route","#focus"))
        }
        val click=PendingIntent.getActivity(context,id,intent,PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        try {
            val notification=NotificationCompat.Builder(context,CHANNEL)
                .setSmallIcon(love.bibu.space.R.drawable.ic_stat_bibo)
                .setContentTitle(row.getString("title")).setContentText(row.getString("body"))
                .setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setContentIntent(click).setAutoCancel(true).build()
            (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager).notify("reminder",id,notification)
            status(context,id,row,"posted") // Posted to Android, not an observed read/delivery receipt.
        } catch(_: SecurityException) { status(context,id,row,"blocked") }
    }
    @Synchronized fun restore(context: Context) {
        val now=System.currentTimeMillis()
        for(row in rows(context)) if(row.optString("status")=="scheduled") {
            val id=row.getInt("id")
            if(ReminderPolicy.expired(row.getLong("at"),now)) status(context,id,row,"expired")
            else alarm(context).setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP,maxOf(now+1000,row.getLong("at")),pending(context,id))
        }
    }
}
class BiboReminderReceiver: BroadcastReceiver() {
    override fun onReceive(context: Context,intent:Intent) {
        val task=goAsync()
        Thread {
            try {
                if(intent.action=="love.bibu.REMINDER") BiboReminders.deliver(context,intent.getIntExtra("id",0))
                else if(intent.action in listOf(Intent.ACTION_BOOT_COMPLETED,Intent.ACTION_MY_PACKAGE_REPLACED,Intent.ACTION_TIME_CHANGED)) BiboReminders.restore(context)
            } catch(error:Exception) { android.util.Log.e("BiboReminders","Reminder processing failed",error) }
            finally {task.finish()}
        }.start()
    }
}

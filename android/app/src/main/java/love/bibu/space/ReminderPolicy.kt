package love.bibu.space

object ReminderPolicy {
    const val DAY = 86400000L
    fun valid(id: Int, at: Long, now: Long) = id > 0 && at > now && at - now <= 366 * DAY
    fun expired(at: Long, now: Long) = now > at && now - at > DAY
}

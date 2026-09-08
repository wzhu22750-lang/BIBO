package love.bibu.space

// Android-independent reducer: totals union intervals, clips them to the requested local day.
class UsageWindow(private val start: Long, private val end: Long, private val target: String?) {
    private var previous = start
    private var interactive: Boolean? = null
    private val activities = mutableSetOf<String>()
    private var total = 0L
    var observed = false
        private set
    fun accept(time: Long, type: Int, packageName: String?, activity: String?) {
        if (time > end) return
        val at = time.coerceAtLeast(start)
        if (at >= previous) {
            if (if (target == null) interactive == true else activities.isNotEmpty() && interactive != false) total += at - previous
            previous = at
        }
        when (type) {
            15 -> { interactive = true; if(target == null) observed = true } // SCREEN_INTERACTIVE
            16 -> { interactive = false; activities.clear(); if(target == null) observed = true }
            26, 27 -> { interactive = false; activities.clear() } // shutdown/startup
            1 -> if (target != null && packageName == target) { activities.add(activity ?: packageName); observed = true }
            2, 23 -> if (target != null && packageName == target) { activities.remove(activity ?: packageName); observed = true }
        }
    }
    fun finish(): Long {
        if (if(target == null) interactive == true else activities.isNotEmpty() && interactive != false) total += (end-previous).coerceAtLeast(0)
        previous=end
        return total.coerceIn(0, (end-start).coerceAtLeast(0))
    }
}

package love.bibu.space

import android.os.SystemClock
import java.util.concurrent.atomic.AtomicLong

/**
 * 桌面小组件点击节流器。
 * 冷却窗口默认为 1500 毫秒（1.5 秒）。
 * 首次调用放行；
 * 距离上次接受（放行）的时间小于 windowMs 时拒绝，且拒绝时不延长冷却窗口；
 * 距离上次接受大于或等于 windowMs 时放行，并更新上次放行时间戳。
 */
class WidgetClickThrottle(private val windowMs: Long = DEFAULT_WINDOW_MS) {

    private val lastAcceptedAtMs = AtomicLong(UNSET_TIME)

    fun tryAcquire(nowMs: Long = SystemClock.elapsedRealtime()): Boolean {
        while (true) {
            val last = lastAcceptedAtMs.get()
            if (last != UNSET_TIME && nowMs - last < windowMs) {
                return false
            }
            if (lastAcceptedAtMs.compareAndSet(last, nowMs)) {
                return true
            }
        }
    }

    companion object {
        const val DEFAULT_WINDOW_MS = 1500L
        private const val UNSET_TIME = -1L
    }
}

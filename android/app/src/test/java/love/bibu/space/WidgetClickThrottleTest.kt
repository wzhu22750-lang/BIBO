package love.bibu.space

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class WidgetClickThrottleTest {

    @Test
    fun allowsFirstAcquireAtZeroMs() {
        val throttle = WidgetClickThrottle(1500L)
        assertTrue(throttle.tryAcquire(0L))
    }

    @Test
    fun rejectsAcquireBeforeWindowExpires() {
        val throttle = WidgetClickThrottle(1500L)
        assertTrue(throttle.tryAcquire(1000L))
        assertFalse(throttle.tryAcquire(1001L))
        assertFalse(throttle.tryAcquire(2000L))
        assertFalse(throttle.tryAcquire(2499L))
    }

    @Test
    fun allowsAcquireAtExactBoundary() {
        val throttle = WidgetClickThrottle(1500L)
        assertTrue(throttle.tryAcquire(1000L))
        assertFalse(throttle.tryAcquire(2499L))
        assertTrue(throttle.tryAcquire(2500L))
    }

    @Test
    fun allowsAcquireAfterWindowExpires() {
        val throttle = WidgetClickThrottle(1500L)
        assertTrue(throttle.tryAcquire(1000L))
        assertTrue(throttle.tryAcquire(3000L))
    }

    @Test
    fun rejectionsDoNotExtendThrottleWindow() {
        val throttle = WidgetClickThrottle(1500L)
        assertTrue(throttle.tryAcquire(0L))

        // Multiple rejected calls within cooldown window
        assertFalse(throttle.tryAcquire(500L))
        assertFalse(throttle.tryAcquire(1000L))
        assertFalse(throttle.tryAcquire(1400L))
        assertFalse(throttle.tryAcquire(1499L))

        // At 1500ms, window expires and should be allowed immediately
        // even though there was a rejection at 1499ms
        assertTrue(throttle.tryAcquire(1500L))

        // And new window starts at 1500ms
        assertFalse(throttle.tryAcquire(2000L))
        assertFalse(throttle.tryAcquire(2999L))
        assertTrue(throttle.tryAcquire(3000L))
    }

    @Test
    fun customWindowMsIsRespected() {
        val throttle = WidgetClickThrottle(500L)
        assertTrue(throttle.tryAcquire(100L))
        assertFalse(throttle.tryAcquire(599L))
        assertTrue(throttle.tryAcquire(600L))
    }
}

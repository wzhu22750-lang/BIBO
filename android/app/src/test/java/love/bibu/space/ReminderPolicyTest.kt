package love.bibu.space
import org.junit.Assert.*
import org.junit.Test
class ReminderPolicyTest {
    @Test fun requiresPositiveIdAndFutureBoundedTime() {
        assertFalse(ReminderPolicy.valid(0,2000,1000))
        assertFalse(ReminderPolicy.valid(1,1000,1000))
        assertFalse(ReminderPolicy.valid(1,999,1000))
        assertTrue(ReminderPolicy.valid(1,1001,1000))
        assertTrue(ReminderPolicy.valid(1,1000+366*ReminderPolicy.DAY,1000))
        assertFalse(ReminderPolicy.valid(1,1001+366*ReminderPolicy.DAY,1000))
    }
    @Test fun neverReplaysRemindersOverOneDayLate() {
        assertFalse(ReminderPolicy.expired(2000,1000))
        assertFalse(ReminderPolicy.expired(1000,1000+ReminderPolicy.DAY))
        assertTrue(ReminderPolicy.expired(1000,1001+ReminderPolicy.DAY))
    }
}

package love.bibu.space
import org.junit.Assert.*
import org.junit.Test
class UsageWindowTest {
    @Test fun clipsAcrossMidnightAndStopsAtScreenOff() {
        val w=UsageWindow(100,300,null)
        w.accept(50,15,null,null); w.accept(200,16,null,null)
        assertEquals(100L,w.finish()); assertTrue(w.observed)
    }
    @Test fun unionsOverlappingActivitiesRatherThanDoubleCounting() {
        val w=UsageWindow(100,400,"a.app")
        w.accept(100,1,"a.app","one"); w.accept(150,1,"a.app","two")
        w.accept(200,2,"a.app","one"); w.accept(300,2,"a.app","two")
        assertEquals(200L,w.finish())
    }
    @Test fun shutdownStopsUsageAndRepeatedFinishDoesNotInflate() {
        val w=UsageWindow(100,400,null)
        w.accept(100,15,null,null); w.accept(200,26,null,null)
        assertEquals(100L,w.finish()); assertEquals(100L,w.finish())
    }
    @Test fun missingAndUnrelatedEventsRemainUnknown() {
        val w=UsageWindow(100,400,"a.app")
        w.accept(100,1,"b.app","one")
        assertFalse(w.observed); assertEquals(0L,w.finish())
    }
    @Test fun screenOffClosesAppAndFutureEventsCannotExtendToday() {
        val w=UsageWindow(100,400,"a.app")
        w.accept(100,1,"a.app","one"); w.accept(200,16,null,null)
        w.accept(500,1,"a.app","one")
        assertEquals(100L,w.finish())
    }
}

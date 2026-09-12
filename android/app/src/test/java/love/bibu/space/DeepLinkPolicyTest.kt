package love.bibu.space
import org.junit.Assert.*
import org.junit.Test
class DeepLinkPolicyTest {
    private fun route(uri:String):String? {
        val raw=uri.removePrefix("love.bibu.space://")
        val parts=raw.split('?',limit=2);val hostPath=parts[0].split('/',limit=2);val query=parts.getOrNull(1).orEmpty().split('&').associate { item -> item.split('=',limit=2).let { it[0] to it.getOrNull(1) } }
        return DeepLinkPolicy.dataRoute("love.bibu.space",hostPath[0],if(hostPath.size>1)"/${hostPath[1]}" else "",query["message"],query["event"],query["action"],"love.bibu.space")
    }
    @Test fun acceptsOnlyTheOwnedSchemeAndKnownPages() {
        assertEquals("#home",route("love.bibu.space://home"));assertEquals("#home?action=bibu",route("love.bibu.space://home?action=bibu"));assertEquals("#chat?message=abc_123",route("love.bibu.space://chat?message=abc_123"));assertEquals("#events?event=event-1",route("love.bibu.space://events?event=event-1"));assertNull(DeepLinkPolicy.dataRoute("https","chat","", "abc",null,"love.bibu.space"));assertNull(route("love.bibu.space://unknown"));assertNull(route("love.bibu.space://chat/other?message=abc"))
    }
    @Test fun invalidOrIrrelevantQueryBecomesSafePageOrHome() {
        assertEquals("#chat",route("love.bibu.space://chat?message=../secret"));assertEquals("#events",route("love.bibu.space://events?message=abc"));assertEquals("#home",route("love.bibu.space://home?event=abc"));assertEquals("#home",route("love.bibu.space://home?action=../bad"))
    }
    @Test fun explicitNotificationExtraHasSameValidation() {
        assertTrue(DeepLinkPolicy.validHash("#chat?message=abc"));assertTrue(DeepLinkPolicy.validHash("#home?action=bibu"));assertFalse(DeepLinkPolicy.validHash("https://evil"));assertFalse(DeepLinkPolicy.validHash("#chat?message=../x"))
    }
    @Test fun pushColdStartClickRoutesFromDataExtras() {
        assertEquals("#events?event=abc_123",DeepLinkPolicy.pushClickRoute("#events?event=abc_123"))
        assertEquals("#home",DeepLinkPolicy.pushClickRoute("https://evil.test"))
        assertEquals("#home",DeepLinkPolicy.pushClickRoute("#home"))
        assertNull(DeepLinkPolicy.pushClickRoute(null))
    }
}

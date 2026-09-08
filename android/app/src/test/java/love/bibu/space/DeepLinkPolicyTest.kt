package love.bibu.space
import org.junit.Assert.*
import org.junit.Test
class DeepLinkPolicyTest {
    private fun route(uri:String):String? {
        val raw=uri.removePrefix("love.bibu.space://")
        val parts=raw.split('?',limit=2);val hostPath=parts[0].split('/',limit=2);val query=parts.getOrNull(1).orEmpty().split('&').associate { item -> item.split('=',limit=2).let { it[0] to it.getOrNull(1) } }
        return DeepLinkPolicy.dataRoute("love.bibu.space",hostPath[0],if(hostPath.size>1)"/${hostPath[1]}" else "",query["message"],query["event"],"love.bibu.space")
    }
    @Test fun acceptsOnlyTheOwnedSchemeAndKnownPages() {
        assertEquals("#home",route("love.bibu.space://home"));assertEquals("#chat?message=abc_123",route("love.bibu.space://chat?message=abc_123"));assertEquals("#events?event=event-1",route("love.bibu.space://events?event=event-1"));assertNull(DeepLinkPolicy.dataRoute("https","chat","", "abc",null,"love.bibu.space"));assertNull(route("love.bibu.space://unknown"));assertNull(route("love.bibu.space://chat/other?message=abc"))
    }
    @Test fun invalidOrIrrelevantQueryBecomesSafePageOrHome() {
        assertEquals("#chat",route("love.bibu.space://chat?message=../secret"));assertEquals("#events",route("love.bibu.space://events?message=abc"));assertEquals("#home",route("love.bibu.space://home?event=abc"))
    }
    @Test fun explicitNotificationExtraHasSameValidation() {
        assertTrue(DeepLinkPolicy.validHash("#chat?message=abc"));assertFalse(DeepLinkPolicy.validHash("https://evil"));assertFalse(DeepLinkPolicy.validHash("#chat?message=../x"))
    }
    @Test fun fcmColdStartClickRoutesFromDataExtras() {
        // App process was killed: the Capacitor push plugin replays no action event, so the
        // launch intent's message data extras must carry the whitelisted route themselves.
        assertEquals("#events?event=abc_123",DeepLinkPolicy.fcmClickRoute("0:1234","#events?event=abc_123"))
        assertEquals("#home",DeepLinkPolicy.fcmClickRoute("0:1","https://evil.test"))
        assertEquals("#home",DeepLinkPolicy.fcmClickRoute("0:1","#home"))
        // Plain third-party launch intents without an FCM message id are not click navigation.
        assertNull(DeepLinkPolicy.fcmClickRoute(null,"#settings"))
        assertNull(DeepLinkPolicy.fcmClickRoute("0:1",null))
    }
}

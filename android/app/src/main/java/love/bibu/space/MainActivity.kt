package love.bibu.space

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(BiboDevicePlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}

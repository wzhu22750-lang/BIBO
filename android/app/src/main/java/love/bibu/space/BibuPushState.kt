package love.bibu.space

/**
 * 跨组件共享的个推 CID 与在线状态：BibuGTIntentService 写入，Capacitor 插件
 * 读取并转发给 WebView。IntentService 与插件同在主进程，静态对象即可通信。
 */
object BibuPushState {
    @Volatile
    var cid: String? = null
        private set

    @Volatile
    var isOnline: Boolean? = null
        private set

    @Volatile
    var lastActionTime: Long = 0L
        private set

    private val pending = mutableListOf<(String) -> Unit>()

    /**
     * CID 已就绪则立即回调；否则入队等待（收到 CID 后一次性消费）。
     */
    fun onCid(callback: (String) -> Unit) {
        val current = cid
        if (current != null) {
            callback(current)
            return
        }
        synchronized(pending) { pending.add(callback) }
    }

    fun setCid(value: String) {
        if (value.isBlank()) return
        lastActionTime = System.currentTimeMillis()
        if (cid == value) return
        cid = value
        val callbacks = synchronized(pending) { pending.toList().also { pending.clear() } }
        callbacks.forEach { it(value) }
    }

    fun setOnline(online: Boolean) {
        isOnline = online
        lastActionTime = System.currentTimeMillis()
    }

    fun clear() {
        cid = null
        isOnline = null
    }
}

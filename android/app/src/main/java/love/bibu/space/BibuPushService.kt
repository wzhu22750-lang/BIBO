package love.bibu.space

import com.igexin.sdk.PushService

/**
 * 个推推送长连接服务。空实现即可——SDK 通过扫描 manifest 中声明且
 * 继承 PushService 的组件来启动自身的推送进程（:pushservice）。
 */
class BibuPushService : PushService()
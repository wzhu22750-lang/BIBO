package love.bibu.space

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import androidx.core.content.ContextCompat

/**
 * 通知大图标：把应用图标 drawable 渲染成位图。
 *
 * 注意：Android 8+（API 26+）上 R.mipmap.ic_launcher 会解析为
 * mipmap-anydpi-v26 里的 adaptive-icon XML，BitmapFactory.decodeResource
 * 无法解码 XML，会返回 null，导致通知只剩白色小图标、没有彩色应用图标。
 * 这里统一走 drawable → Canvas 的方式，自适应图标也能正确渲染。
 */
internal fun notificationLargeIcon(context: Context): Bitmap? = try {
    val drawable = ContextCompat.getDrawable(context, R.mipmap.ic_launcher) ?: return null
    if (drawable is BitmapDrawable && drawable.bitmap != null) {
        drawable.bitmap
    } else {
        val size = if (drawable.intrinsicWidth > 0 && drawable.intrinsicHeight > 0) {
            maxOf(drawable.intrinsicWidth, drawable.intrinsicHeight)
        } else {
            192
        }
        Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888).also { bitmap ->
            val canvas = Canvas(bitmap)
            drawable.setBounds(0, 0, size, size)
            drawable.draw(canvas)
        }
    }
} catch (_: Exception) {
    null
}

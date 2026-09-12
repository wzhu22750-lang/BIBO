package love.bibu.space

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.util.Log
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL

object WidgetPhotoCache {
    private const val TAG = "WidgetPhotoCache"
    private const val DIR_NAME = "widget_photos"
    private const val MAX_PHOTOS = 3
    private const val MAX_DIMENSION = 200 // Max 200x200 to prevent RemoteViews transaction overflow

    fun getPhotoDir(context: Context): File {
        val dir = File(context.filesDir, DIR_NAME)
        if (!dir.exists()) {
            dir.mkdirs()
        }
        return dir
    }

    fun getCachedPhotoFiles(context: Context): List<File> {
        val dir = getPhotoDir(context)
        val files = mutableListOf<File>()
        for (i in 0 until MAX_PHOTOS) {
            val file = File(dir, "photo_$i.jpg")
            if (file.exists() && file.length() > 0) {
                files.add(file)
            }
        }
        return files
    }

    /**
     * Downloads up to MAX_PHOTOS images synchronously (call from background thread/coroutine).
     * Replaces existing cached files.
     */
    fun downloadPhotos(context: Context, urls: List<String>) {
        val dir = getPhotoDir(context)

        // Clear existing photo files
        for (i in 0 until MAX_PHOTOS) {
            val oldFile = File(dir, "photo_$i.jpg")
            if (oldFile.exists()) {
                oldFile.delete()
            }
        }

        val targetUrls = urls.take(MAX_PHOTOS)
        for (i in targetUrls.indices) {
            val urlString = targetUrls[i]
            if (urlString.isBlank()) continue
            val outputFile = File(dir, "photo_$i.jpg")

            try {
                val url = URL(urlString)
                val conn = (url.openConnection() as HttpURLConnection).apply {
                    connectTimeout = 10000
                    readTimeout = 10000
                    doInput = true
                    instanceFollowRedirects = true
                }
                conn.connect()
                if (conn.responseCode in 200..299) {
                    conn.inputStream.use { input ->
                        // Decode stream with downsampling to avoid RemoteViews TransactionTooLargeException
                        val tempBytes = input.readBytes()
                        val opts = BitmapFactory.Options().apply {
                            inJustDecodeBounds = true
                        }
                        BitmapFactory.decodeByteArray(tempBytes, 0, tempBytes.size, opts)

                        var sampleSize = 1
                        val maxSide = maxOf(opts.outWidth, opts.outHeight)
                        if (maxSide > MAX_DIMENSION) {
                            sampleSize = maxSide / MAX_DIMENSION
                        }
                        opts.inSampleSize = sampleSize.coerceAtLeast(1)
                        opts.inJustDecodeBounds = false

                        val bitmap = BitmapFactory.decodeByteArray(tempBytes, 0, tempBytes.size, opts)
                        if (bitmap != null) {
                            FileOutputStream(outputFile).use { out ->
                                bitmap.compress(Bitmap.CompressFormat.JPEG, 85, out)
                            }
                            bitmap.recycle()
                        }
                    }
                } else {
                    Log.w(TAG, "Failed downloading widget photo $i: HTTP ${conn.responseCode}")
                }
                conn.disconnect()
            } catch (e: Exception) {
                Log.w(TAG, "Exception downloading widget photo $i: ${e.message}")
            }
        }
    }
}

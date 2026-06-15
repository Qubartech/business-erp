package com.example.businesserp.core.utils

import java.text.SimpleDateFormat
import java.util.*

object DateUtils {
    private const val ISO_FORMAT = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"

    private fun getIsoFormatter(): SimpleDateFormat {
        return SimpleDateFormat(ISO_FORMAT, Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
    }

    fun parseIsoToLong(isoString: String?): Long? {
        if (isoString.isNullOrEmpty()) return null
        return try {
            // Support formats without milliseconds if backend varies
            val format = if (isoString.contains(".")) getIsoFormatter() 
                         else SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply { timeZone = TimeZone.getTimeZone("UTC") }
            format.parse(isoString)?.time
        } catch (e: Exception) {
            null
        }
    }

    fun formatLongToIso(timestamp: Long?): String? {
        if (timestamp == null) return null
        return try {
            getIsoFormatter().format(Date(timestamp))
        } catch (e: Exception) {
            null
        }
    }

    fun formatDuration(minutes: Int?): String {
        if (minutes == null) return "--"
        val hours = minutes / 60
        val remainingMinutes = minutes % 60
        return if (hours > 0) "${hours}h ${remainingMinutes}m" else "${remainingMinutes}m"
    }

    fun formatTime(timestamp: Long): String {
        val format = SimpleDateFormat("hh:mm a", Locale.getDefault())
        return format.format(Date(timestamp))
    }

    fun formatDate(timestamp: Long): String {
        val format = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
        return format.format(Date(timestamp))
    }
}

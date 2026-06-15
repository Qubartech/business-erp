package com.example.businesserp.features.timer.domain.model

data class TimeEntry(
    val id: String,
    val taskId: String,
    val userId: String,
    val startTime: Long,
    val endTime: Long?,
    val durationMinutes: Int?,
    val createdAt: Long,
    val taskTitle: String? = null
)

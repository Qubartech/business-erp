package com.example.businesserp.features.timer.data.remote

import kotlinx.serialization.Serializable

@Serializable
data class StartTimerRequest(
    val taskId: String
)

@Serializable
data class StopTimerRequest(
    val entryId: String,
    val endTime: String? = null
)

@Serializable
data class TimeEntryTaskDto(
    val id: String,
    val title: String,
    val projectId: String
)

@Serializable
data class TimeEntryDto(
    val id: String,
    val taskId: String,
    val userId: String,
    val startTime: String,
    val endTime: String? = null,
    val durationMinutes: Int? = null,
    val createdAt: String,
    val task: TimeEntryTaskDto? = null
)

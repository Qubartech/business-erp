package com.example.businesserp.features.timer.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "time_entries")
data class TimeEntryEntity(
    @PrimaryKey val id: String,
    val taskId: String,
    val userId: String,
    val startTime: Long,
    val endTime: Long?,
    val durationMinutes: Int?,
    val createdAt: Long,
    val taskTitle: String? = null
)

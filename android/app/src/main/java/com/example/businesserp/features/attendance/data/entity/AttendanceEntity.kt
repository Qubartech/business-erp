package com.example.businesserp.features.attendance.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "attendance")
data class AttendanceEntity(
    @PrimaryKey val id: String,
    val userId: String,
    val checkIn: Long,
    val checkOut: Long?,
    val createdAt: Long,
    val updatedAt: Long
)

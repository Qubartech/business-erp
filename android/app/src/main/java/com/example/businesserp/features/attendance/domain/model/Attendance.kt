package com.example.businesserp.features.attendance.domain.model

data class Attendance(
    val id: String,
    val userId: String,
    val checkIn: Long,
    val checkOut: Long?,
    val createdAt: Long,
    val updatedAt: Long
)

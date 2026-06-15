package com.example.businesserp.features.attendance.data.remote

import kotlinx.serialization.Serializable

@Serializable
data class AttendanceDto(
    val id: String,
    val userId: String,
    val checkIn: String,
    val checkOut: String? = null,
    val createdAt: String,
    val updatedAt: String
)

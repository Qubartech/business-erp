package com.example.businesserp.features.attendance.domain.repository

import com.example.businesserp.features.attendance.domain.model.Attendance
import kotlinx.coroutines.flow.Flow

interface AttendanceRepository {
    fun getAllAttendanceFlow(): Flow<List<Attendance>>
    fun getActiveAttendanceFlow(): Flow<Attendance?>
    suspend fun fetchActiveAttendanceToday(): Result<Attendance?>
    suspend fun fetchAttendanceHistory(): Result<List<Attendance>>
    suspend fun checkIn(): Result<Attendance>
    suspend fun checkOut(): Result<Attendance>
}

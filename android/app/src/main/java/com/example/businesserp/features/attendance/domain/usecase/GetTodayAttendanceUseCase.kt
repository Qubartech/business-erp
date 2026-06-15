package com.example.businesserp.features.attendance.domain.usecase

import com.example.businesserp.features.attendance.domain.model.Attendance
import com.example.businesserp.features.attendance.domain.repository.AttendanceRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetTodayAttendanceUseCase @Inject constructor(
    private val repository: AttendanceRepository
) {
    fun getActiveAttendanceFlow(): Flow<Attendance?> {
        return repository.getActiveAttendanceFlow()
    }

    suspend fun fetchActiveAttendanceToday(): Result<Attendance?> {
        return repository.fetchActiveAttendanceToday()
    }
}

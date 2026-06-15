package com.example.businesserp.features.attendance.presentation

import com.example.businesserp.features.attendance.domain.model.Attendance

data class AttendanceHistoryState(
    val activeAttendance: Attendance? = null,
    val attendanceHistory: List<Attendance> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

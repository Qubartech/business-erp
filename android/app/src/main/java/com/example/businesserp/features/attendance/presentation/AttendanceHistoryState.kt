package com.example.businesserp.features.attendance.presentation

import com.example.businesserp.features.attendance.domain.model.Attendance

data class ActiveTeamMember(
    val id: String,
    val userId: String,
    val userName: String,
    val userEmail: String,
    val checkInTime: Long,
    val activeTaskTitle: String?
)

data class AttendanceHistoryState(
    val activeAttendance: Attendance? = null,
    val attendanceHistory: List<Attendance> = emptyList(),
    val activeTeamMembers: List<ActiveTeamMember> = emptyList(),
    val userRole: String = "member",
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

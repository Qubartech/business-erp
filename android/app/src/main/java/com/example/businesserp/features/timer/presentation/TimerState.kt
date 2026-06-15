package com.example.businesserp.features.timer.presentation

import com.example.businesserp.features.timer.domain.model.TimeEntry
import com.example.businesserp.features.attendance.domain.model.Attendance

data class TimerState(
    val activeTimer: TimeEntry? = null,
    val activeAttendance: Attendance? = null,
    val timeEntries: List<TimeEntry> = emptyList(),
    val attendanceHistory: List<Attendance> = emptyList(),
    val commits: List<com.example.businesserp.features.timer.domain.model.Commit> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

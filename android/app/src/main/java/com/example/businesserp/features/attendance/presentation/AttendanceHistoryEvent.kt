package com.example.businesserp.features.attendance.presentation

sealed interface AttendanceHistoryEvent {
    data object RefreshAttendance : AttendanceHistoryEvent
    data object CheckIn : AttendanceHistoryEvent
    data object CheckOut : AttendanceHistoryEvent
    data object DismissError : AttendanceHistoryEvent
}

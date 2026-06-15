package com.example.businesserp.features.timer.presentation

sealed interface TimerEvent {
    data class StartTimer(val taskId: String) : TimerEvent
    data class StopTimer(val entryId: String) : TimerEvent
    data object CheckIn : TimerEvent
    data object CheckOut : TimerEvent
    data object RefreshStatus : TimerEvent
    data object DismissError : TimerEvent
}

package com.example.businesserp.features.tasks.presentation

sealed interface TasksEvent {
    data object Refresh : TasksEvent
    data class SelectProject(val projectId: String?) : TasksEvent
    data class FilterStatus(val status: String?) : TasksEvent
    data class StartTaskTimer(val taskId: String) : TasksEvent
    data class StopTaskTimer(val entryId: String) : TasksEvent
    data class UpdateStatus(val taskId: String, val status: String) : TasksEvent
    data object DismissError : TasksEvent
}

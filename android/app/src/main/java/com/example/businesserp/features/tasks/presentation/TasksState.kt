package com.example.businesserp.features.tasks.presentation

import com.example.businesserp.features.projects.domain.model.Project
import com.example.businesserp.features.tasks.domain.model.Task
import com.example.businesserp.features.timer.domain.model.TimeEntry

data class TasksState(
    val projects: List<Project> = emptyList(),
    val tasks: List<Task> = emptyList(),
    val activeTimer: TimeEntry? = null,
    val selectedProjectId: String? = null,
    val filterStatus: String? = null,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

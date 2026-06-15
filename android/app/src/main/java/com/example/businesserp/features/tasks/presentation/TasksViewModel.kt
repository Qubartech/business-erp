package com.example.businesserp.features.tasks.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.businesserp.features.projects.domain.repository.ProjectRepository
import com.example.businesserp.features.projects.domain.usecase.GetProjectsUseCase
import com.example.businesserp.features.tasks.domain.repository.TaskRepository
import com.example.businesserp.features.tasks.domain.usecase.GetTasksUseCase
import com.example.businesserp.features.tasks.domain.usecase.UpdateTaskStatusUseCase
import com.example.businesserp.features.timer.domain.repository.TimeEntryRepository
import com.example.businesserp.features.timer.domain.usecase.StartTimerUseCase
import com.example.businesserp.features.timer.domain.usecase.StopTimerUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import com.example.businesserp.core.security.SessionManager
import javax.inject.Inject

@HiltViewModel
class TasksViewModel @Inject constructor(
    private val getProjectsUseCase: GetProjectsUseCase,
    private val getTasksUseCase: GetTasksUseCase,
    private val updateTaskStatusUseCase: UpdateTaskStatusUseCase,
    private val startTimerUseCase: StartTimerUseCase,
    private val stopTimerUseCase: StopTimerUseCase,
    private val timeEntryRepository: TimeEntryRepository,
    private val projectRepository: ProjectRepository,
    private val taskRepository: TaskRepository,
    private val sessionManager: SessionManager
) : ViewModel() {

    private val _state = MutableStateFlow(TasksState())
    val state: StateFlow<TasksState> = _state.asStateFlow()

    init {
        observeLocalDatabase()
        refreshSync()
    }

    private fun observeLocalDatabase() {
        val currentUserId = sessionManager.getUserId()

        viewModelScope.launch {
            projectRepository.getAllProjectsFlow().collect { projects ->
                _state.update { it.copy(projects = projects) }
            }
        }

        viewModelScope.launch {
            taskRepository.getAllTasksFlow().collect { tasks ->
                _state.update { it.copy(tasks = tasks) }
            }
        }

        viewModelScope.launch {
            timeEntryRepository.getRunningTimerFlow().collect { active ->
                if (active != null && active.userId == currentUserId) {
                    _state.update { it.copy(activeTimer = active) }
                } else {
                    _state.update { it.copy(activeTimer = null) }
                }
            }
        }
    }

    fun onEvent(event: TasksEvent) {
        when (event) {
            is TasksEvent.Refresh -> refreshSync()
            is TasksEvent.SelectProject -> _state.update { it.copy(selectedProjectId = event.projectId) }
            is TasksEvent.FilterStatus -> _state.update { it.copy(filterStatus = event.status) }
            is TasksEvent.DismissError -> _state.update { it.copy(errorMessage = null) }
            is TasksEvent.StartTaskTimer -> startTaskTimer(event.taskId)
            is TasksEvent.StopTaskTimer -> stopTaskTimer(event.entryId)
            is TasksEvent.UpdateStatus -> updateTaskStatus(event.taskId, event.status)
        }
    }

    private fun refreshSync() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val projectsResult = getProjectsUseCase.refreshProjects()
            val tasksResult = getTasksUseCase.refreshTasks()
            
            // Sync running timer as well
            timeEntryRepository.fetchRunningTimer()

            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = projectsResult.exceptionOrNull()?.message
                        ?: tasksResult.exceptionOrNull()?.message
                )
            }
        }
    }

    private fun startTaskTimer(taskId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = startTimerUseCase(taskId)
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message
                )
            }
        }
    }

    private fun stopTaskTimer(entryId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = stopTimerUseCase(entryId)
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message
                )
            }
        }
    }

    private fun updateTaskStatus(taskId: String, status: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = updateTaskStatusUseCase(taskId, status)
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message
                )
            }
            if (result.isSuccess) {
                // Fetch latest tasks to make sure DB reflects correct details
                taskRepository.fetchTasks()
            }
        }
    }
}

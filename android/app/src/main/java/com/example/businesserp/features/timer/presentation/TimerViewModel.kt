package com.example.businesserp.features.timer.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.businesserp.features.attendance.domain.repository.AttendanceRepository
import com.example.businesserp.features.attendance.domain.usecase.CheckInUseCase
import com.example.businesserp.features.attendance.domain.usecase.CheckOutUseCase
import com.example.businesserp.features.attendance.domain.usecase.GetTodayAttendanceUseCase
import com.example.businesserp.features.timer.domain.repository.TimeEntryRepository
import com.example.businesserp.features.timer.domain.usecase.GetRunningTimerUseCase
import com.example.businesserp.features.timer.domain.usecase.StartTimerUseCase
import com.example.businesserp.features.timer.domain.usecase.StopTimerUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TimerViewModel @Inject constructor(
    private val startTimerUseCase: StartTimerUseCase,
    private val stopTimerUseCase: StopTimerUseCase,
    private val getRunningTimerUseCase: GetRunningTimerUseCase,
    private val checkInUseCase: CheckInUseCase,
    private val checkOutUseCase: CheckOutUseCase,
    private val getTodayAttendanceUseCase: GetTodayAttendanceUseCase,
    private val timeEntryRepository: TimeEntryRepository,
    private val attendanceRepository: AttendanceRepository,
    private val dashboardService: com.example.businesserp.features.timer.data.remote.DashboardService,
    private val commitDao: com.example.businesserp.features.timer.data.dao.CommitDao
) : ViewModel() {

    private val _state = MutableStateFlow(TimerState())
    val state: StateFlow<TimerState> = _state.asStateFlow()

    init {
        observeLocalDatabase()
        refreshSync()
    }

    private fun observeLocalDatabase() {
        viewModelScope.launch {
            timeEntryRepository.getAllTimeEntriesFlow().collect { entries ->
                _state.update { it.copy(timeEntries = entries) }
            }
        }

        viewModelScope.launch {
            timeEntryRepository.getRunningTimerFlow().collect { active ->
                _state.update { it.copy(activeTimer = active) }
            }
        }

        viewModelScope.launch {
            attendanceRepository.getAllAttendanceFlow().collect { history ->
                _state.update { it.copy(attendanceHistory = history) }
            }
        }

        viewModelScope.launch {
            attendanceRepository.getActiveAttendanceFlow().collect { active ->
                _state.update { it.copy(activeAttendance = active) }
            }
        }

        viewModelScope.launch {
            commitDao.getAllCommitsFlow().collect { entities ->
                _state.update { state ->
                    state.copy(
                        commits = entities.map { entity ->
                            com.example.businesserp.features.timer.domain.model.Commit(
                                sha = entity.sha,
                                projectId = entity.projectId,
                                projectName = entity.projectName,
                                message = entity.message,
                                authorName = entity.authorName,
                                authorEmail = entity.authorEmail,
                                url = entity.url,
                                committedAt = entity.committedAt
                            )
                        }
                    )
                }
            }
        }
    }

    fun onEvent(event: TimerEvent) {
        when (event) {
            is TimerEvent.StartTimer -> startTimer(event.taskId)
            is TimerEvent.StopTimer -> stopTimer(event.entryId)
            is TimerEvent.CheckIn -> checkIn()
            is TimerEvent.CheckOut -> checkOut()
            is TimerEvent.RefreshStatus -> refreshSync()
            is TimerEvent.DismissError -> _state.update { it.copy(errorMessage = null) }
        }
    }

    private fun refreshSync() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            
            // Sync running timer and attendance status
            val timerResult = getRunningTimerUseCase.fetchRunningTimer()
            val attendanceResult = getTodayAttendanceUseCase.fetchActiveAttendanceToday()
            
            // Fetch histories in background
            launch { timeEntryRepository.fetchTimeEntries() }
            launch { attendanceRepository.fetchAttendanceHistory() }

            // Fetch commits via dashboard summary
            val dashboardResult = runCatching {
                dashboardService.getSummary()
            }

            val dashboardResponse = dashboardResult.getOrNull()
            if (dashboardResponse != null && dashboardResponse.success && dashboardResponse.data != null) {
                val commitEntities = dashboardResponse.data.latestCommits.map { dto ->
                    com.example.businesserp.features.timer.data.entity.CommitEntity(
                        sha = dto.sha,
                        projectId = dto.projectId ?: "",
                        projectName = dto.project?.name ?: "Unknown Project",
                        message = dto.message,
                        authorName = dto.authorName,
                        authorEmail = dto.authorEmail,
                        url = dto.url,
                        committedAt = com.example.businesserp.core.utils.DateUtils.parseIsoToLong(dto.committedAt) ?: System.currentTimeMillis()
                    )
                }
                commitDao.deleteAll()
                commitDao.insertAll(commitEntities)
            }

            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = timerResult.exceptionOrNull()?.message 
                        ?: attendanceResult.exceptionOrNull()?.message
                        ?: dashboardResult.exceptionOrNull()?.message
                )
            }
        }
    }

    private fun startTimer(taskId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = startTimerUseCase(taskId)
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message
                )
            }
            if (result.isSuccess) {
                // Refresh list to include new item
                timeEntryRepository.fetchTimeEntries()
            }
        }
    }

    private fun stopTimer(entryId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = stopTimerUseCase(entryId)
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message
                )
            }
            if (result.isSuccess) {
                // Refresh list
                timeEntryRepository.fetchTimeEntries()
            }
        }
    }

    private fun checkIn() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = checkInUseCase()
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message
                )
            }
            if (result.isSuccess) {
                attendanceRepository.fetchAttendanceHistory()
            }
        }
    }

    private fun checkOut() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = checkOutUseCase()
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message
                )
            }
            if (result.isSuccess) {
                attendanceRepository.fetchAttendanceHistory()
            }
        }
    }
}

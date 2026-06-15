package com.example.businesserp.features.attendance.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.businesserp.features.attendance.domain.repository.AttendanceRepository
import com.example.businesserp.features.attendance.domain.usecase.CheckInUseCase
import com.example.businesserp.features.attendance.domain.usecase.CheckOutUseCase
import com.example.businesserp.features.attendance.domain.usecase.GetTodayAttendanceUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import com.example.businesserp.core.security.SessionManager
import javax.inject.Inject

@HiltViewModel
class AttendanceHistoryViewModel @Inject constructor(
    private val checkInUseCase: CheckInUseCase,
    private val checkOutUseCase: CheckOutUseCase,
    private val getTodayAttendanceUseCase: GetTodayAttendanceUseCase,
    private val attendanceRepository: AttendanceRepository,
    private val sessionManager: SessionManager,
    private val dashboardService: com.example.businesserp.features.timer.data.remote.DashboardService
) : ViewModel() {

    private val _state = MutableStateFlow(AttendanceHistoryState())
    val state: StateFlow<AttendanceHistoryState> = _state.asStateFlow()

    init {
        _state.update { it.copy(userRole = sessionManager.getUserRole() ?: "member") }
        observeAttendance()
        refreshSync()
    }

    private fun observeAttendance() {
        val currentUserId = sessionManager.getUserId()

        viewModelScope.launch {
            attendanceRepository.getAllAttendanceFlow().collect { history ->
                _state.update { it.copy(attendanceHistory = history.filter { it.userId == currentUserId }) }
            }
        }

        viewModelScope.launch {
            attendanceRepository.getActiveAttendanceFlow().collect { active ->
                if (active != null && active.userId == currentUserId) {
                    _state.update { it.copy(activeAttendance = active) }
                } else {
                    _state.update { it.copy(activeAttendance = null) }
                }
            }
        }
    }

    fun onEvent(event: AttendanceHistoryEvent) {
        when (event) {
            is AttendanceHistoryEvent.RefreshAttendance -> refreshSync()
            is AttendanceHistoryEvent.CheckIn -> checkIn()
            is AttendanceHistoryEvent.CheckOut -> checkOut()
            is AttendanceHistoryEvent.DismissError -> {
                _state.update { it.copy(errorMessage = null) }
            }
        }
    }

    private fun refreshSync() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val todayResult = getTodayAttendanceUseCase.fetchActiveAttendanceToday()
            val historyResult = attendanceRepository.fetchAttendanceHistory()
            
            var adminError: String? = null
            if (sessionManager.getUserRole() == "admin") {
                val summaryResult = runCatching { dashboardService.getSummary() }
                val response = summaryResult.getOrNull()
                if (response != null && response.success && response.data != null) {
                    val activeMembers = response.data.activeAttendance.map { dto ->
                        val activeTask = dto.user.timeEntries.firstOrNull { it.task != null }?.task?.title
                        ActiveTeamMember(
                            id = dto.id,
                            userId = dto.userId,
                            userName = dto.user.name,
                            userEmail = dto.user.email,
                            checkInTime = com.example.businesserp.core.utils.DateUtils.parseIsoToLong(dto.checkIn) ?: System.currentTimeMillis(),
                            activeTaskTitle = activeTask
                        )
                    }
                    _state.update { it.copy(activeTeamMembers = activeMembers) }
                } else if (summaryResult.isFailure) {
                    adminError = summaryResult.exceptionOrNull()?.message
                }
            }

            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = todayResult.exceptionOrNull()?.message 
                        ?: historyResult.exceptionOrNull()?.message
                        ?: adminError
                )
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

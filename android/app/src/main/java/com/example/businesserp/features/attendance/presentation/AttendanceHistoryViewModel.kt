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
import javax.inject.Inject

@HiltViewModel
class AttendanceHistoryViewModel @Inject constructor(
    private val checkInUseCase: CheckInUseCase,
    private val checkOutUseCase: CheckOutUseCase,
    private val getTodayAttendanceUseCase: GetTodayAttendanceUseCase,
    private val attendanceRepository: AttendanceRepository
) : ViewModel() {

    private val _state = MutableStateFlow(AttendanceHistoryState())
    val state: StateFlow<AttendanceHistoryState> = _state.asStateFlow()

    init {
        observeAttendance()
        refreshSync()
    }

    private fun observeAttendance() {
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
            val activeResult = getTodayAttendanceUseCase.fetchActiveAttendanceToday()
            val historyResult = attendanceRepository.fetchAttendanceHistory()
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = activeResult.exceptionOrNull()?.message 
                        ?: historyResult.exceptionOrNull()?.message
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

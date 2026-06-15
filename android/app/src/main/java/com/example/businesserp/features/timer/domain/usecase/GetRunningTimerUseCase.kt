package com.example.businesserp.features.timer.domain.usecase

import com.example.businesserp.features.timer.domain.model.TimeEntry
import com.example.businesserp.features.timer.domain.repository.TimeEntryRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetRunningTimerUseCase @Inject constructor(
    private val repository: TimeEntryRepository
) {
    fun getRunningTimerFlow(): Flow<TimeEntry?> {
        return repository.getRunningTimerFlow()
    }

    suspend fun fetchRunningTimer(): Result<TimeEntry?> {
        return repository.fetchRunningTimer()
    }
}

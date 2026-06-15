package com.example.businesserp.features.timer.domain.usecase

import com.example.businesserp.features.timer.domain.model.TimeEntry
import com.example.businesserp.features.timer.domain.repository.TimeEntryRepository
import javax.inject.Inject

class StartTimerUseCase @Inject constructor(
    private val repository: TimeEntryRepository
) {
    suspend operator fun invoke(taskId: String): Result<TimeEntry> {
        return repository.startTimer(taskId)
    }
}

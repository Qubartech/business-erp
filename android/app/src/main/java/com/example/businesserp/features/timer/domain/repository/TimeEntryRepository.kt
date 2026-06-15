package com.example.businesserp.features.timer.domain.repository

import com.example.businesserp.features.timer.domain.model.TimeEntry
import kotlinx.coroutines.flow.Flow

interface TimeEntryRepository {
    fun getAllTimeEntriesFlow(): Flow<List<TimeEntry>>
    fun getRunningTimerFlow(): Flow<TimeEntry?>
    suspend fun fetchRunningTimer(): Result<TimeEntry?>
    suspend fun fetchTimeEntries(): Result<List<TimeEntry>>
    suspend fun startTimer(taskId: String): Result<TimeEntry>
    suspend fun stopTimer(entryId: String): Result<TimeEntry>
}

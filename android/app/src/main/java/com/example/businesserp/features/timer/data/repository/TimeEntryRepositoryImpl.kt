package com.example.businesserp.features.timer.data.repository

import com.example.businesserp.core.utils.DateUtils
import com.example.businesserp.features.timer.data.dao.TimeEntryDao
import com.example.businesserp.features.timer.data.entity.TimeEntryEntity
import com.example.businesserp.features.timer.data.remote.StartTimerRequest
import com.example.businesserp.features.timer.data.remote.StopTimerRequest
import com.example.businesserp.features.timer.data.remote.TimeEntryDto
import com.example.businesserp.features.timer.data.remote.TimeEntryService
import com.example.businesserp.features.timer.domain.model.TimeEntry
import com.example.businesserp.features.timer.domain.repository.TimeEntryRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TimeEntryRepositoryImpl @Inject constructor(
    private val timeEntryService: TimeEntryService,
    private val timeEntryDao: TimeEntryDao
) : TimeEntryRepository {

    override fun getAllTimeEntriesFlow(): Flow<List<TimeEntry>> {
        return timeEntryDao.getAllTimeEntriesFlow().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun getRunningTimerFlow(): Flow<TimeEntry?> {
        return timeEntryDao.getRunningTimerFlow().map { it?.toDomain() }
    }

    override suspend fun fetchRunningTimer(): Result<TimeEntry?> {
        return try {
            val response = timeEntryService.current()
            if (response.success) {
                val dto = response.data
                if (dto != null) {
                    val entity = dto.toEntity()
                    timeEntryDao.insert(entity)
                    Result.success(entity.toDomain())
                } else {
                    // Check if we have a locally running timer that needs to be cleared
                    val localRunning = timeEntryDao.getRunningTimer()
                    if (localRunning != null) {
                        timeEntryDao.deleteById(localRunning.id)
                    }
                    Result.success(null)
                }
            } else {
                Result.failure(Exception(response.message ?: "Failed to fetch current timer"))
            }
        } catch (e: Exception) {
            // Offline fallback: return whatever local running timer we have
            val local = timeEntryDao.getRunningTimer()?.toDomain()
            Result.success(local)
        }
    }

    override suspend fun fetchTimeEntries(): Result<List<TimeEntry>> {
        return try {
            val response = timeEntryService.list(emptyMap())
            if (response.success && response.data != null) {
                val dtos = response.data.items
                val entities = dtos.map { it.toEntity() }
                // Re-sync local cache
                timeEntryDao.deleteAll()
                timeEntryDao.insertAll(entities)
                Result.success(entities.map { it.toDomain() })
            } else {
                Result.failure(Exception(response.message ?: "Failed to list time entries"))
            }
        } catch (e: Exception) {
            // Offline: fallback to DB
            Result.failure(e)
        }
    }

    override suspend fun startTimer(taskId: String): Result<TimeEntry> {
        return try {
            val response = timeEntryService.start(StartTimerRequest(taskId))
            if (response.success && response.data != null) {
                val dto = response.data
                val entity = dto.toEntity()
                timeEntryDao.insert(entity)
                Result.success(entity.toDomain())
            } else {
                Result.failure(Exception(response.message ?: "Failed to start timer"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun stopTimer(entryId: String): Result<TimeEntry> {
        return try {
            val response = timeEntryService.stop(StopTimerRequest(entryId))
            if (response.success && response.data != null) {
                val dto = response.data
                val entity = dto.toEntity()
                timeEntryDao.insert(entity)
                Result.success(entity.toDomain())
            } else {
                Result.failure(Exception(response.message ?: "Failed to stop timer"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Mapper helper extension functions
    private fun TimeEntryDto.toEntity() = TimeEntryEntity(
        id = id,
        taskId = taskId,
        userId = userId,
        startTime = DateUtils.parseIsoToLong(startTime) ?: System.currentTimeMillis(),
        endTime = DateUtils.parseIsoToLong(endTime),
        durationMinutes = durationMinutes,
        createdAt = DateUtils.parseIsoToLong(createdAt) ?: System.currentTimeMillis(),
        taskTitle = task?.title
    )

    private fun TimeEntryEntity.toDomain() = TimeEntry(
        id = id,
        taskId = taskId,
        userId = userId,
        startTime = startTime,
        endTime = endTime,
        durationMinutes = durationMinutes,
        createdAt = createdAt,
        taskTitle = taskTitle
    )
}

package com.example.businesserp.features.attendance.data.repository

import com.example.businesserp.core.utils.DateUtils
import com.example.businesserp.features.attendance.data.dao.AttendanceDao
import com.example.businesserp.features.attendance.data.entity.AttendanceEntity
import com.example.businesserp.features.attendance.data.remote.AttendanceDto
import com.example.businesserp.features.attendance.data.remote.AttendanceService
import com.example.businesserp.features.attendance.domain.model.Attendance
import com.example.businesserp.features.attendance.domain.repository.AttendanceRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AttendanceRepositoryImpl @Inject constructor(
    private val attendanceService: AttendanceService,
    private val attendanceDao: AttendanceDao
) : AttendanceRepository {

    override fun getAllAttendanceFlow(): Flow<List<Attendance>> {
        return attendanceDao.getAllAttendanceFlow().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun getActiveAttendanceFlow(): Flow<Attendance?> {
        return attendanceDao.getActiveAttendanceFlow().map { it?.toDomain() }
    }

    override suspend fun fetchActiveAttendanceToday(): Result<Attendance?> {
        return try {
            val response = attendanceService.today()
            if (response.success) {
                val dto = response.data
                if (dto != null) {
                    val entity = dto.toEntity()
                    attendanceDao.insert(entity)
                    Result.success(entity.toDomain())
                } else {
                    // Check if we need to clear local active checkins
                    val active = attendanceDao.getActiveAttendance()
                    if (active != null) {
                        // Delete or set mock checkout locally to sync with null on backend
                        attendanceDao.deleteAll() // Simple resync
                    }
                    Result.success(null)
                }
            } else {
                Result.failure(Exception(response.message ?: "Failed to fetch today's attendance"))
            }
        } catch (e: Exception) {
            // Offline fallback: return current local active checkin
            val active = attendanceDao.getActiveAttendance()?.toDomain()
            Result.success(active)
        }
    }

    override suspend fun fetchAttendanceHistory(): Result<List<Attendance>> {
        return try {
            val response = attendanceService.list(emptyMap())
            if (response.success && response.data != null) {
                val dtos = response.data.items
                val entities = dtos.map { it.toEntity() }
                attendanceDao.deleteAll()
                attendanceDao.insertAll(entities)
                Result.success(entities.map { it.toDomain() })
            } else {
                Result.failure(Exception(response.message ?: "Failed to fetch attendance history"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun checkIn(): Result<Attendance> {
        return try {
            val response = attendanceService.checkIn()
            if (response.success && response.data != null) {
                val dto = response.data
                val entity = dto.toEntity()
                attendanceDao.insert(entity)
                Result.success(entity.toDomain())
            } else {
                Result.failure(Exception(response.message ?: "Check-in failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun checkOut(): Result<Attendance> {
        return try {
            val response = attendanceService.checkOut()
            if (response.success && response.data != null) {
                val dto = response.data
                val entity = dto.toEntity()
                attendanceDao.insert(entity)
                Result.success(entity.toDomain())
            } else {
                Result.failure(Exception(response.message ?: "Check-out failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    // Mapper helper extension functions
    private fun AttendanceDto.toEntity() = AttendanceEntity(
        id = id,
        userId = userId,
        checkIn = DateUtils.parseIsoToLong(checkIn) ?: System.currentTimeMillis(),
        checkOut = DateUtils.parseIsoToLong(checkOut),
        createdAt = DateUtils.parseIsoToLong(createdAt) ?: System.currentTimeMillis(),
        updatedAt = DateUtils.parseIsoToLong(updatedAt) ?: System.currentTimeMillis()
    )

    private fun AttendanceEntity.toDomain() = Attendance(
        id = id,
        userId = userId,
        checkIn = checkIn,
        checkOut = checkOut,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

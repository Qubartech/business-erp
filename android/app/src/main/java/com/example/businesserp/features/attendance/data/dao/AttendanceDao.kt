package com.example.businesserp.features.attendance.data.dao

import androidx.room.*
import com.example.businesserp.features.attendance.data.entity.AttendanceEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AttendanceDao {
    @Query("SELECT * FROM attendance ORDER BY checkIn DESC")
    fun getAllAttendanceFlow(): Flow<List<AttendanceEntity>>

    @Query("SELECT * FROM attendance WHERE checkOut IS NULL LIMIT 1")
    suspend fun getActiveAttendance(): AttendanceEntity?

    @Query("SELECT * FROM attendance WHERE checkOut IS NULL LIMIT 1")
    fun getActiveAttendanceFlow(): Flow<AttendanceEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(attendance: AttendanceEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(attendances: List<AttendanceEntity>)

    @Query("DELETE FROM attendance")
    suspend fun deleteAll()
}

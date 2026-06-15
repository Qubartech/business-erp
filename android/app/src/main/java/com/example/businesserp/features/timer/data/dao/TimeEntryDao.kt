package com.example.businesserp.features.timer.data.dao

import androidx.room.*
import com.example.businesserp.features.timer.data.entity.TimeEntryEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface TimeEntryDao {
    @Query("SELECT * FROM time_entries ORDER BY startTime DESC")
    fun getAllTimeEntriesFlow(): Flow<List<TimeEntryEntity>>

    @Query("SELECT * FROM time_entries WHERE endTime IS NULL LIMIT 1")
    suspend fun getRunningTimer(): TimeEntryEntity?

    @Query("SELECT * FROM time_entries WHERE endTime IS NULL LIMIT 1")
    fun getRunningTimerFlow(): Flow<TimeEntryEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(entry: TimeEntryEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(entries: List<TimeEntryEntity>)

    @Query("DELETE FROM time_entries WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM time_entries")
    suspend fun deleteAll()
}

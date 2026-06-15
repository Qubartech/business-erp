package com.example.businesserp.features.timer.data.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.example.businesserp.features.timer.data.entity.CommitEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface CommitDao {
    @Query("SELECT * FROM commits ORDER BY committedAt DESC")
    fun getAllCommitsFlow(): Flow<List<CommitEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(commits: List<CommitEntity>)

    @Query("DELETE FROM commits")
    suspend fun deleteAll()
}

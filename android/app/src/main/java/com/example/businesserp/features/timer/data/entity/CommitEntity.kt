package com.example.businesserp.features.timer.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "commits")
data class CommitEntity(
    @PrimaryKey val sha: String,
    val projectId: String,
    val projectName: String,
    val message: String,
    val authorName: String,
    val authorEmail: String,
    val url: String?,
    val committedAt: Long
)

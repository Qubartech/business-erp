package com.example.businesserp.features.tasks.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey val id: String,
    val projectId: String,
    val title: String,
    val description: String?,
    val status: String,
    val priority: String,
    val assignedTo: String?,
    val dueDate: Long?,
    val createdBy: String,
    val createdAt: Long,
    val updatedAt: Long
)

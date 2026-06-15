package com.example.businesserp.features.tasks.domain.model

data class Task(
    val id: String,
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

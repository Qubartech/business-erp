package com.example.businesserp.features.tasks.data.remote

import kotlinx.serialization.Serializable

@Serializable
data class TaskDto(
    val id: String,
    val projectId: String,
    val title: String,
    val description: String? = null,
    val status: String,
    val priority: String,
    val assignedTo: String? = null,
    val dueDate: String? = null,
    val createdBy: String,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class UpdateTaskStatusRequest(
    val status: String
)

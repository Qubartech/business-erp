package com.example.businesserp.features.tasks.domain.repository

import com.example.businesserp.features.tasks.domain.model.Task
import kotlinx.coroutines.flow.Flow

interface TaskRepository {
    fun getAllTasksFlow(): Flow<List<Task>>
    fun getTasksForProjectFlow(projectId: String): Flow<List<Task>>
    suspend fun fetchTasks(): Result<List<Task>>
    suspend fun updateTaskStatus(taskId: String, status: String): Result<Task>
}

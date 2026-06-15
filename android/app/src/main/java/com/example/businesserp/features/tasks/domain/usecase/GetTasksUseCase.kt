package com.example.businesserp.features.tasks.domain.usecase

import com.example.businesserp.features.tasks.domain.model.Task
import com.example.businesserp.features.tasks.domain.repository.TaskRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetTasksUseCase @Inject constructor(
    private val repository: TaskRepository
) {
    fun getTasksFlow(): Flow<List<Task>> {
        return repository.getAllTasksFlow()
    }

    fun getTasksForProjectFlow(projectId: String): Flow<List<Task>> {
        return repository.getTasksForProjectFlow(projectId)
    }

    suspend fun refreshTasks(): Result<List<Task>> {
        return repository.fetchTasks()
    }
}

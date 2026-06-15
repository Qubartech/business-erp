package com.example.businesserp.features.tasks.domain.usecase

import com.example.businesserp.features.tasks.domain.model.Task
import com.example.businesserp.features.tasks.domain.repository.TaskRepository
import javax.inject.Inject

class UpdateTaskStatusUseCase @Inject constructor(
    private val repository: TaskRepository
) {
    suspend operator fun invoke(taskId: String, status: String): Result<Task> {
        return repository.updateTaskStatus(taskId, status)
    }
}

package com.example.businesserp.features.tasks.data.repository

import com.example.businesserp.core.utils.DateUtils
import com.example.businesserp.features.tasks.data.dao.TaskDao
import com.example.businesserp.features.tasks.data.entity.TaskEntity
import com.example.businesserp.features.tasks.data.remote.TaskDto
import com.example.businesserp.features.tasks.data.remote.TaskService
import com.example.businesserp.features.tasks.data.remote.UpdateTaskStatusRequest
import com.example.businesserp.features.tasks.domain.model.Task
import com.example.businesserp.features.tasks.domain.repository.TaskRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TaskRepositoryImpl @Inject constructor(
    private val taskService: TaskService,
    private val taskDao: TaskDao
) : TaskRepository {

    override fun getAllTasksFlow(): Flow<List<Task>> {
        return taskDao.getAllTasksFlow().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun getTasksForProjectFlow(projectId: String): Flow<List<Task>> {
        return taskDao.getTasksForProjectFlow(projectId).map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun fetchTasks(): Result<List<Task>> {
        return try {
            val response = taskService.list(emptyMap())
            if (response.success && response.data != null) {
                val dtos = response.data.items
                val entities = dtos.map { it.toEntity() }
                taskDao.deleteAll()
                taskDao.insertAll(entities)
                Result.success(entities.map { it.toDomain() })
            } else {
                Result.failure(Exception(response.message ?: "Failed to fetch tasks"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateTaskStatus(taskId: String, status: String): Result<Task> {
        return try {
            val response = taskService.updateStatus(taskId, UpdateTaskStatusRequest(status))
            if (response.success && response.data != null) {
                val dto = response.data
                val entity = dto.toEntity()
                taskDao.insert(entity)
                Result.success(entity.toDomain())
            } else {
                Result.failure(Exception(response.message ?: "Failed to update task status"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun TaskDto.toEntity() = TaskEntity(
        id = id,
        projectId = projectId,
        title = title,
        description = description,
        status = status,
        priority = priority,
        assignedTo = assignedTo,
        dueDate = DateUtils.parseIsoToLong(dueDate),
        createdBy = createdBy,
        createdAt = DateUtils.parseIsoToLong(createdAt) ?: System.currentTimeMillis(),
        updatedAt = DateUtils.parseIsoToLong(updatedAt) ?: System.currentTimeMillis()
    )

    private fun TaskEntity.toDomain() = Task(
        id = id,
        projectId = projectId,
        title = title,
        description = description,
        status = status,
        priority = priority,
        assignedTo = assignedTo,
        dueDate = dueDate,
        createdBy = createdBy,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

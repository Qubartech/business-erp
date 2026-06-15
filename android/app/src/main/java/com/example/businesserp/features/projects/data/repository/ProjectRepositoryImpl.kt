package com.example.businesserp.features.projects.data.repository

import com.example.businesserp.core.utils.DateUtils
import com.example.businesserp.features.projects.data.dao.ProjectDao
import com.example.businesserp.features.projects.data.entity.ProjectEntity
import com.example.businesserp.features.projects.data.remote.ProjectDto
import com.example.businesserp.features.projects.data.remote.ProjectService
import com.example.businesserp.features.projects.domain.model.Project
import com.example.businesserp.features.projects.domain.repository.ProjectRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ProjectRepositoryImpl @Inject constructor(
    private val projectService: ProjectService,
    private val projectDao: ProjectDao
) : ProjectRepository {

    override fun getAllProjectsFlow(): Flow<List<Project>> {
        return projectDao.getAllProjectsFlow().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun fetchProjects(): Result<List<Project>> {
        return try {
            val response = projectService.list(emptyMap())
            if (response.success && response.data != null) {
                val dtos = response.data.items
                val entities = dtos.map { it.toEntity() }
                projectDao.deleteAll()
                projectDao.insertAll(entities)
                Result.success(entities.map { it.toDomain() })
            } else {
                Result.failure(Exception(response.message ?: "Failed to fetch projects"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun ProjectDto.toEntity() = ProjectEntity(
        id = id,
        name = name,
        description = description,
        status = status,
        category = category,
        startDate = DateUtils.parseIsoToLong(startDate),
        endDate = DateUtils.parseIsoToLong(endDate),
        createdBy = createdBy,
        githubRepo = githubRepo,
        createdAt = DateUtils.parseIsoToLong(createdAt) ?: System.currentTimeMillis(),
        updatedAt = DateUtils.parseIsoToLong(updatedAt) ?: System.currentTimeMillis()
    )

    private fun ProjectEntity.toDomain() = Project(
        id = id,
        name = name,
        description = description,
        status = status,
        category = category,
        startDate = startDate,
        endDate = endDate,
        createdBy = createdBy,
        githubRepo = githubRepo,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

package com.example.businesserp.features.projects.domain.usecase

import com.example.businesserp.features.projects.domain.model.Project
import com.example.businesserp.features.projects.domain.repository.ProjectRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetProjectsUseCase @Inject constructor(
    private val repository: ProjectRepository
) {
    fun getProjectsFlow(): Flow<List<Project>> {
        return repository.getAllProjectsFlow()
    }

    suspend fun refreshProjects(): Result<List<Project>> {
        return repository.fetchProjects()
    }
}

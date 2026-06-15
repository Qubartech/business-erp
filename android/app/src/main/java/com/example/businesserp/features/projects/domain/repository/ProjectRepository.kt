package com.example.businesserp.features.projects.domain.repository

import com.example.businesserp.features.projects.domain.model.Project
import kotlinx.coroutines.flow.Flow

interface ProjectRepository {
    fun getAllProjectsFlow(): Flow<List<Project>>
    suspend fun fetchProjects(): Result<List<Project>>
}

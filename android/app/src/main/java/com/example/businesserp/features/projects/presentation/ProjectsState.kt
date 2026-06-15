package com.example.businesserp.features.projects.presentation

import com.example.businesserp.features.projects.domain.model.Project

enum class ProjectCategoryFilter {
    ALL,
    CLIENT,
    NON_CLIENT
}

data class ProjectsState(
    val projects: List<Project> = emptyList(),
    val filterCategory: ProjectCategoryFilter = ProjectCategoryFilter.ALL,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

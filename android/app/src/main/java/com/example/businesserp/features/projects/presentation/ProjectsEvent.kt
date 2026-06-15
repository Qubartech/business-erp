package com.example.businesserp.features.projects.presentation

sealed interface ProjectsEvent {
    data object RefreshProjects : ProjectsEvent
    data class FilterCategoryChanged(val filter: ProjectCategoryFilter) : ProjectsEvent
    data object DismissError : ProjectsEvent
}

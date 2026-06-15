package com.example.businesserp.features.projects.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.businesserp.features.projects.domain.usecase.GetProjectsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProjectsViewModel @Inject constructor(
    private val getProjectsUseCase: GetProjectsUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(ProjectsState())
    val state: StateFlow<ProjectsState> = _state.asStateFlow()

    init {
        observeProjects()
        refreshSync()
    }

    private fun observeProjects() {
        viewModelScope.launch {
            getProjectsUseCase.getProjectsFlow().collect { projects ->
                _state.update { it.copy(projects = projects) }
            }
        }
    }

    fun onEvent(event: ProjectsEvent) {
        when (event) {
            is ProjectsEvent.RefreshProjects -> refreshSync()
            is ProjectsEvent.FilterCategoryChanged -> {
                _state.update { it.copy(filterCategory = event.filter) }
            }
            is ProjectsEvent.DismissError -> {
                _state.update { it.copy(errorMessage = null) }
            }
        }
    }

    private fun refreshSync() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = getProjectsUseCase.refreshProjects()
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message
                )
            }
        }
    }
}

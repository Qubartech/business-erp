package com.example.businesserp.features.projects.presentation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun ProjectsRootScreen(
    onNavigateToSettings: () -> Unit,
    viewModel: ProjectsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    ProjectsScreen(
        state = state,
        onEvent = { event -> viewModel.onEvent(event) },
        onNavigateToSettings = onNavigateToSettings
    )
}

package com.example.businesserp.features.tasks.presentation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun TasksRootScreen(
    onNavigateToSettings: () -> Unit,
    viewModel: TasksViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    TasksScreen(
        state = state,
        onEvent = { event -> viewModel.onEvent(event) },
        onNavigateToSettings = onNavigateToSettings
    )
}

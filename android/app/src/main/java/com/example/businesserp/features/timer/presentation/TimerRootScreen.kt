package com.example.businesserp.features.timer.presentation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun TimerRootScreen(
    onNavigateToSettings: () -> Unit,
    viewModel: TimerViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    TimerScreen(
        state = state,
        onEvent = { event -> viewModel.onEvent(event) },
        onNavigateToSettings = onNavigateToSettings
    )
}

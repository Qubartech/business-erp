package com.example.businesserp.features.notes.presentation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun NotesRootScreen(
    onNavigateToSettings: () -> Unit,
    viewModel: NotesViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    NotesScreen(
        state = state,
        onEvent = { event -> viewModel.onEvent(event) },
        onNavigateToSettings = onNavigateToSettings
    )
}

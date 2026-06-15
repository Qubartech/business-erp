package com.example.businesserp.features.attendance.presentation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun AttendanceHistoryRootScreen(
    onNavigateToSettings: () -> Unit,
    viewModel: AttendanceHistoryViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    AttendanceHistoryScreen(
        state = state,
        onEvent = { event -> viewModel.onEvent(event) },
        onNavigateToSettings = onNavigateToSettings
    )
}

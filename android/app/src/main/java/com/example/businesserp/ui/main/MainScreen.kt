package com.example.businesserp.ui.main

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.navigationBars
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import com.example.businesserp.features.notes.presentation.NotesRootScreen
import com.example.businesserp.features.projects.presentation.ProjectsRootScreen
import com.example.businesserp.features.attendance.presentation.AttendanceHistoryRootScreen
import com.example.businesserp.features.tasks.presentation.TasksRootScreen
import com.example.businesserp.features.timer.presentation.TimerRootScreen

private enum class MainTab(val label: String, val icon: ImageVector) {
    Dashboard("Dashboard", Icons.Default.Home),
    Tasks("Tasks", Icons.Default.List),
    Projects("Projects", Icons.Default.Folder),
    Attendance("Attendance", Icons.Default.DateRange),
    Notes("Notes", Icons.Default.Edit)
}

@Composable
fun MainScreen(
    onNavigateToLogin: () -> Unit,
    onNavigateToSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedTab by remember { mutableStateOf(MainTab.Dashboard) }

    Scaffold(
        bottomBar = {
            NavigationBar(
                windowInsets = WindowInsets.navigationBars
            ) {
                MainTab.entries.forEach { tab ->
                    NavigationBarItem(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        label = { Text(tab.label) },
                        icon = { Icon(imageVector = tab.icon, contentDescription = tab.label) }
                    )
                }
            }
        },
        modifier = modifier
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (selectedTab) {
                MainTab.Dashboard -> TimerRootScreen(
                    onNavigateToSettings = onNavigateToSettings,
                    onNavigateToTabName = { tabName ->
                        selectedTab = MainTab.entries.firstOrNull { it.label.equals(tabName, ignoreCase = true) } ?: MainTab.Dashboard
                    }
                )
                MainTab.Tasks -> TasksRootScreen(
                    onNavigateToSettings = onNavigateToSettings
                )
                MainTab.Projects -> ProjectsRootScreen(
                    onNavigateToSettings = onNavigateToSettings
                )
                MainTab.Attendance -> AttendanceHistoryRootScreen(
                    onNavigateToSettings = onNavigateToSettings
                )
                MainTab.Notes -> NotesRootScreen(
                    onNavigateToSettings = onNavigateToSettings
                )
            }
        }
    }
}

package com.example.businesserp.ui.main

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.List
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.businesserp.features.notes.presentation.NotesRootScreen
import com.example.businesserp.features.projects.presentation.ProjectsRootScreen
import com.example.businesserp.features.attendance.presentation.AttendanceHistoryRootScreen
import com.example.businesserp.features.tasks.presentation.TasksRootScreen
import com.example.businesserp.features.timer.presentation.TimerRootScreen
import com.example.businesserp.theme.HrPrimary
import com.example.businesserp.theme.HrSlateLight

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
            Box(
                modifier = Modifier
                    .navigationBarsPadding()
                    .padding(start = 16.dp, end = 16.dp, bottom = 12.dp)
                    .fillMaxWidth()
            ) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp, horizontal = 4.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        MainTab.entries.forEach { tab ->
                            val isSelected = selectedTab == tab
                            val activeColor = HrPrimary
                            val inactiveColor = HrSlateLight
                            
                            val scale by animateFloatAsState(
                                targetValue = if (isSelected) 1.15f else 1.0f,
                                label = "scale"
                            )
                            
                            Column(
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable(
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = null
                                    ) { selectedTab = tab },
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.Center
                            ) {
                                Icon(
                                    imageVector = tab.icon,
                                    contentDescription = tab.label,
                                    tint = if (isSelected) activeColor else inactiveColor,
                                    modifier = Modifier
                                        .size(24.dp)
                                        .graphicsLayer(scaleX = scale, scaleY = scale)
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = tab.label,
                                    fontSize = 10.sp,
                                    fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                    color = if (isSelected) activeColor else inactiveColor
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Box(
                                    modifier = Modifier
                                        .size(4.dp)
                                        .clip(CircleShape)
                                        .background(if (isSelected) activeColor else Color.Transparent)
                                )
                            }
                        }
                    }
                }
            }
        },
        contentWindowInsets = WindowInsets(0, 0, 0, 0),
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

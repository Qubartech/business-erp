package com.example.businesserp.features.tasks.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.businesserp.core.components.ErpCard
import com.example.businesserp.core.components.ErpErrorView
import com.example.businesserp.features.projects.domain.model.Project
import com.example.businesserp.features.tasks.domain.model.Task
import com.example.businesserp.features.timer.domain.model.TimeEntry
import com.example.businesserp.theme.BusinessERPTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksScreen(
    state: TasksState,
    onEvent: (TasksEvent) -> Unit,
    onNavigateToSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Filter tasks based on selections
    val filteredTasks = remember(state.tasks, state.selectedProjectId, state.filterStatus) {
        state.tasks.filter { task ->
            val projectMatch = state.selectedProjectId == null || task.projectId == state.selectedProjectId
            val statusMatch = state.filterStatus == null || task.status.equals(state.filterStatus, ignoreCase = true)
            projectMatch && statusMatch
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tasks & Projects", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { onEvent(TasksEvent.Refresh) }) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(imageVector = Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                // Horizontal scrollable project filter
                ProjectFilterChips(
                    projects = state.projects,
                    selectedProjectId = state.selectedProjectId,
                    onProjectSelected = { onEvent(TasksEvent.SelectProject(it)) }
                )

                // Horizontal scrollable status filter
                StatusFilterChips(
                    selectedStatus = state.filterStatus,
                    onStatusSelected = { onEvent(TasksEvent.FilterStatus(it)) }
                )

                // Task List
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f)
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    if (state.errorMessage != null) {
                        item {
                            ErpErrorView(
                                message = state.errorMessage,
                                onDismiss = { onEvent(TasksEvent.DismissError) }
                            )
                        }
                    }

                    if (filteredTasks.isEmpty() && !state.isLoading) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(48.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("No tasks found matching current filters.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    } else {
                        items(filteredTasks) { task ->
                            val isTaskRunning = state.activeTimer?.taskId == task.id
                            val canStartTimer = state.activeTimer == null

                            TaskRow(
                                task = task,
                                isRunning = isTaskRunning,
                                canStartTimer = canStartTimer,
                                onStartTimer = { onEvent(TasksEvent.StartTaskTimer(task.id)) },
                                onStopTimer = { state.activeTimer?.let { onEvent(TasksEvent.StopTaskTimer(it.id)) } },
                                onStatusChange = { newStatus -> onEvent(TasksEvent.UpdateStatus(task.id, newStatus)) }
                            )
                        }
                    }
                }
            }

            if (state.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun ProjectFilterChips(
    projects: List<Project>,
    selectedProjectId: String?,
    onProjectSelected: (String?) -> Unit
) {
    val scrollState = rememberScrollState()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(scrollState)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        FilterChip(
            selected = selectedProjectId == null,
            onClick = { onProjectSelected(null) },
            label = { Text("All Projects") }
        )
        projects.forEach { project ->
            FilterChip(
                selected = selectedProjectId == project.id,
                onClick = { onProjectSelected(project.id) },
                label = { Text(project.name) }
            )
        }
    }
}

@Composable
fun StatusFilterChips(
    selectedStatus: String?,
    onStatusSelected: (String?) -> Unit
) {
    val scrollState = rememberScrollState()
    val statuses = listOf("todo", "in_progress", "review", "done")
    
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(scrollState)
            .padding(horizontal = 16.dp, vertical = 4.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        FilterChip(
            selected = selectedStatus == null,
            onClick = { onStatusSelected(null) },
            label = { Text("All Statuses") }
        )
        statuses.forEach { status ->
            FilterChip(
                selected = selectedStatus?.equals(status, ignoreCase = true) == true,
                onClick = { onStatusSelected(status) },
                label = { Text(status.uppercase().replace("_", " ")) }
            )
        }
    }
}

@Composable
fun TaskRow(
    task: Task,
    isRunning: Boolean,
    canStartTimer: Boolean,
    onStartTimer: () -> Unit,
    onStopTimer: () -> Unit,
    onStatusChange: (String) -> Unit
) {
    var showStatusMenu by remember { mutableStateOf(false) }
    val priorityColor = when (task.priority.lowercase()) {
        "critical" -> MaterialTheme.colorScheme.error
        "high" -> MaterialTheme.colorScheme.error.copy(alpha = 0.7f)
        "medium" -> MaterialTheme.colorScheme.secondary
        else -> MaterialTheme.colorScheme.outline
    }

    ErpCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = task.title,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    if (!task.description.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = task.description,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                // Priority Badge
                Box(
                    modifier = Modifier
                        .padding(start = 8.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(priorityColor.copy(alpha = 0.15f))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = task.priority.uppercase(),
                        color = priorityColor,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Status Selector dropdown trigger
                Box {
                    AssistChip(
                        onClick = { showStatusMenu = true },
                        label = { Text(task.status.uppercase().replace("_", " ")) },
                        trailingIcon = { Icon(Icons.Default.ArrowDropDown, contentDescription = null) }
                    )
                    DropdownMenu(
                        expanded = showStatusMenu,
                        onDismissRequest = { showStatusMenu = false }
                    ) {
                        listOf("todo", "in_progress", "review", "done").forEach { status ->
                            DropdownMenuItem(
                                text = { Text(status.uppercase().replace("_", " ")) },
                                onClick = {
                                    onStatusChange(status)
                                    showStatusMenu = false
                                }
                            )
                        }
                    }
                }

                // Timer Inline control
                if (isRunning) {
                    Button(
                        onClick = onStopTimer,
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error),
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text("Stop", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                } else if (canStartTimer) {
                    Button(
                        onClick = onStartTimer,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4CAF50)), // Green
                        shape = RoundedCornerShape(8.dp),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.White, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Start", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun TasksScreenPreview() {
    val dummyProjects = listOf(Project("p1", "ERP Mobile App", "Build android app", "active", "client", null, null, "u1", null, System.currentTimeMillis(), System.currentTimeMillis()))
    val dummyTasks = listOf(
        Task("t1", "p1", "Create Database Room Structure", "Define entities & daos", "todo", "high", null, null, "u1", System.currentTimeMillis(), System.currentTimeMillis()),
        Task("t2", "p1", "Implement Token Authentication", "AuthInterceptor and TokenAuthenticator", "in_progress", "critical", null, null, "u1", System.currentTimeMillis(), System.currentTimeMillis())
    )

    BusinessERPTheme {
        TasksScreen(
            state = TasksState(
                projects = dummyProjects,
                tasks = dummyTasks,
                activeTimer = null
            ),
            onEvent = {},
            onNavigateToSettings = {}
        )
    }
}

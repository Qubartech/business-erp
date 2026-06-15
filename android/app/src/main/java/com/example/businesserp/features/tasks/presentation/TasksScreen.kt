package com.example.businesserp.features.tasks.presentation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.example.businesserp.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TasksScreen(
    state: TasksState,
    onEvent: (TasksEvent) -> Unit,
    onNavigateToSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
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
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(imageVector = Icons.Default.Settings, contentDescription = "Settings")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
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

                Spacer(modifier = Modifier.height(8.dp))

                // Task List
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .weight(1f)
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(bottom = 16.dp)
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
                                Text(
                                    text = "No tasks found matching current filters.",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 14.sp
                                )
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
                    modifier = Modifier.align(Alignment.Center),
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
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
            .padding(horizontal = 16.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        FilterChip(
            selected = selectedProjectId == null,
            onClick = { onProjectSelected(null) },
            label = { Text("All Projects", fontWeight = FontWeight.Bold, fontSize = 12.sp) },
            shape = RoundedCornerShape(12.dp),
            colors = FilterChipDefaults.filterChipColors(
                selectedContainerColor = HrOrange,
                selectedLabelColor = Color.White,
                containerColor = MaterialTheme.colorScheme.surface,
                labelColor = HrSlateMedium
            ),
            border = FilterChipDefaults.filterChipBorder(
                enabled = true,
                selected = selectedProjectId == null,
                borderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                selectedBorderColor = HrOrange,
                borderWidth = 1.dp
            )
        )
        projects.forEach { project ->
            FilterChip(
                selected = selectedProjectId == project.id,
                onClick = { onProjectSelected(project.id) },
                label = { Text(project.name, fontWeight = FontWeight.Bold, fontSize = 12.sp) },
                shape = RoundedCornerShape(12.dp),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = HrOrange,
                    selectedLabelColor = Color.White,
                    containerColor = MaterialTheme.colorScheme.surface,
                    labelColor = HrSlateMedium
                ),
                border = FilterChipDefaults.filterChipBorder(
                    enabled = true,
                    selected = selectedProjectId == project.id,
                    borderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                    selectedBorderColor = HrOrange,
                    borderWidth = 1.dp
                )
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
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
            label = { Text("All Statuses", fontWeight = FontWeight.Bold, fontSize = 12.sp) },
            shape = RoundedCornerShape(12.dp),
            colors = FilterChipDefaults.filterChipColors(
                selectedContainerColor = HrSlateDark,
                selectedLabelColor = Color.White,
                containerColor = MaterialTheme.colorScheme.surface,
                labelColor = HrSlateMedium
            ),
            border = FilterChipDefaults.filterChipBorder(
                enabled = true,
                selected = selectedStatus == null,
                borderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                selectedBorderColor = HrSlateDark,
                borderWidth = 1.dp
            )
        )
        statuses.forEach { status ->
            FilterChip(
                selected = selectedStatus?.equals(status, ignoreCase = true) == true,
                onClick = { onStatusSelected(status) },
                label = { Text(status.uppercase().replace("_", " "), fontWeight = FontWeight.Bold, fontSize = 12.sp) },
                shape = RoundedCornerShape(12.dp),
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = HrSlateDark,
                    selectedLabelColor = Color.White,
                    containerColor = MaterialTheme.colorScheme.surface,
                    labelColor = HrSlateMedium
                ),
                border = FilterChipDefaults.filterChipBorder(
                    enabled = true,
                    selected = selectedStatus?.equals(status, ignoreCase = true) == true,
                    borderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                    selectedBorderColor = HrSlateDark,
                    borderWidth = 1.dp
                )
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
    
    val (priorityText, priorityColor, priorityBg) = when (task.priority.lowercase()) {
        "critical" -> Triple("CRITICAL", HrRedLeave, HrRedLeaveBg)
        "high" -> Triple("HIGH", HrRedLeave.copy(alpha = 0.8f), HrRedLeaveBg)
        "medium" -> Triple("MEDIUM", HrYellowOvertime, HrYellowOvertimeBg)
        else -> Triple("LOW", HrSlateLight, Color(0xFFF1F5F9))
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
                        color = HrSlateDark
                    )
                    if (!task.description.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = task.description,
                            fontSize = 12.sp,
                            color = HrSlateLight,
                            maxLines = 3,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
                
                // Custom HR state priority badge
                Box(
                    modifier = Modifier
                        .padding(start = 8.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(priorityBg)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = priorityText,
                        color = priorityColor,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Dropdown status chip trigger
                Box {
                    AssistChip(
                        onClick = { showStatusMenu = true },
                        label = { Text(task.status.uppercase().replace("_", " "), fontWeight = FontWeight.Bold, fontSize = 11.sp) },
                        trailingIcon = { Icon(Icons.Default.ArrowDropDown, contentDescription = null, modifier = Modifier.size(16.dp)) },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                            labelColor = HrSlateMedium
                        ),
                        border = BorderStroke(
                            1.dp,
                            MaterialTheme.colorScheme.outline.copy(alpha = 0.4f)
                        ),
                        shape = RoundedCornerShape(12.dp)
                    )
                    DropdownMenu(
                        expanded = showStatusMenu,
                        onDismissRequest = { showStatusMenu = false },
                        modifier = Modifier.background(MaterialTheme.colorScheme.surface)
                    ) {
                        listOf("todo", "in_progress", "review", "done").forEach { status ->
                            DropdownMenuItem(
                                text = { Text(status.uppercase().replace("_", " "), fontWeight = FontWeight.Bold, fontSize = 12.sp, color = HrSlateMedium) },
                                onClick = {
                                    onStatusChange(status)
                                    showStatusMenu = false
                                }
                            )
                        }
                    }
                }

                // Timer Controller
                if (isRunning) {
                    Button(
                        onClick = onStopTimer,
                        colors = ButtonDefaults.buttonColors(containerColor = HrRedLeave),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                        modifier = Modifier.height(36.dp)
                    ) {
                        Text("Stop", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                } else if (canStartTimer) {
                    Button(
                        onClick = onStartTimer,
                        colors = ButtonDefaults.buttonColors(containerColor = HrGreenPresent),
                        shape = RoundedCornerShape(12.dp),
                        contentPadding = PaddingValues(horizontal = 14.dp, vertical = 6.dp),
                        modifier = Modifier.height(36.dp)
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.PlayArrow, contentDescription = null, tint = Color.White, modifier = Modifier.size(14.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Start", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 12.sp)
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

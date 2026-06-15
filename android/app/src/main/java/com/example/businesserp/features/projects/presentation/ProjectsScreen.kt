package com.example.businesserp.features.projects.presentation

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.businesserp.core.components.ErpCard
import com.example.businesserp.core.components.ErpErrorView
import com.example.businesserp.features.projects.domain.model.Project
import com.example.businesserp.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProjectsScreen(
    state: ProjectsState,
    onEvent: (ProjectsEvent) -> Unit,
    onNavigateToSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    val filteredProjects = when (state.filterCategory) {
        ProjectCategoryFilter.ALL -> state.projects
        ProjectCategoryFilter.CLIENT -> state.projects.filter { it.category == "client" }
        ProjectCategoryFilter.NON_CLIENT -> state.projects.filter { it.category == "non_client" }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Projects", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { onEvent(ProjectsEvent.RefreshProjects) }) {
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
                // Category Filter Tabs
                TabRow(
                    selectedTabIndex = state.filterCategory.ordinal,
                    containerColor = MaterialTheme.colorScheme.background,
                    contentColor = HrSlateDark,
                    indicator = { tabPositions ->
                        if (state.filterCategory.ordinal < tabPositions.size) {
                            TabRowDefaults.SecondaryIndicator(
                                Modifier.tabIndicatorOffset(tabPositions[state.filterCategory.ordinal]),
                                color = HrPrimary
                            )
                        }
                    }
                ) {
                    ProjectCategoryFilter.values().forEach { filter ->
                        val isSelected = state.filterCategory == filter
                        Tab(
                            selected = isSelected,
                            onClick = { onEvent(ProjectsEvent.FilterCategoryChanged(filter)) },
                            text = {
                                Text(
                                    text = when (filter) {
                                        ProjectCategoryFilter.ALL -> "All"
                                        ProjectCategoryFilter.CLIENT -> "Client"
                                        ProjectCategoryFilter.NON_CLIENT -> "Internal"
                                    },
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    color = if (isSelected) HrPrimary else HrSlateMedium
                                )
                            }
                        )
                    }
                }

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                    contentPadding = PaddingValues(vertical = 16.dp)
                ) {
                    if (state.errorMessage != null) {
                        item {
                            ErpErrorView(
                                message = state.errorMessage,
                                onDismiss = { onEvent(ProjectsEvent.DismissError) }
                            )
                        }
                    }

                    if (filteredProjects.isEmpty() && !state.isLoading) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 40.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No projects found.",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 14.sp
                                )
                            }
                        }
                    } else {
                        items(filteredProjects) { project ->
                            ProjectCard(project = project)
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

@Composable
fun ProjectCard(project: Project) {
    val (statusLabel, statusColor, statusBg) = when (project.status.lowercase()) {
        "active" -> Triple("ACTIVE", HrGreenPresent, HrGreenPresentBg)
        "completed" -> Triple("COMPLETED", HrSlateLight, Color(0xFFF1F5F9))
        "on_hold" -> Triple("ON HOLD", HrYellowOvertime, HrYellowOvertimeBg)
        else -> Triple(project.status.uppercase(), HrSlateMedium, Color(0xFFF1F5F9))
    }

    ErpCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = project.name,
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = HrSlateDark
                )
                
                // State Badge
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(statusBg)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = statusLabel,
                        color = statusColor,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.ExtraBold
                    )
                }
            }

            if (!project.description.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = project.description,
                    fontSize = 13.sp,
                    color = HrSlateMedium,
                    maxLines = 3
                )
            }

            Spacer(modifier = Modifier.height(14.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f))
            Spacer(modifier = Modifier.height(10.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                val isClient = project.category == "client"
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(if (isClient) Color(0xFFE3F2FD) else Color(0xFFF1F5F9))
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = if (isClient) "Client Project" else "Internal Project",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (isClient) Color(0xFF1E88E5) else HrSlateMedium
                    )
                }
                
                if (!project.githubRepo.isNullOrEmpty()) {
                    Text(
                        text = "🐙 ${project.githubRepo}",
                        fontSize = 11.sp,
                        fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                        color = HrPrimary,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun ProjectsScreenPreview() {
    BusinessERPTheme {
        ProjectsScreen(
            state = ProjectsState(
                projects = listOf(
                    Project("1", "Laravel Ecommerce", "An ecommerce application built in Laravel", "active", "client", null, null, "user1", "qubartech/laravel-ecommerce", System.currentTimeMillis(), System.currentTimeMillis()),
                    Project("2", "QubarTech ERP", "Internal business erp tool", "active", "non_client", null, null, "user1", "qubartech/business-erp", System.currentTimeMillis(), System.currentTimeMillis())
                )
            ),
            onEvent = {},
            onNavigateToSettings = {}
        )
    }
}

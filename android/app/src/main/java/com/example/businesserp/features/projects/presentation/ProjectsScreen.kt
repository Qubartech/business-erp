package com.example.businesserp.features.projects.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.businesserp.core.components.ErpCard
import com.example.businesserp.core.components.ErpErrorView
import com.example.businesserp.features.projects.domain.model.Project
import com.example.businesserp.theme.BusinessERPTheme

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
                // Category Filter Tabs
                TabRow(selectedTabIndex = state.filterCategory.ordinal) {
                    ProjectCategoryFilter.values().forEach { filter ->
                        Tab(
                            selected = state.filterCategory == filter,
                            onClick = { onEvent(ProjectsEvent.FilterCategoryChanged(filter)) },
                            text = {
                                Text(
                                    text = when (filter) {
                                        ProjectCategoryFilter.ALL -> "All"
                                        ProjectCategoryFilter.CLIENT -> "Client"
                                        ProjectCategoryFilter.NON_CLIENT -> "Internal"
                                    },
                                    fontWeight = FontWeight.Bold
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

                    if (filteredProjects.isEmpty()) {
                        item {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 40.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No projects found.",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
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
                    modifier = Modifier.align(Alignment.Center)
                )
            }
        }
    }
}

@Composable
fun ProjectCard(project: Project) {
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
                    fontWeight = FontWeight.ExtraBold,
                    color = MaterialTheme.colorScheme.onSurface
                )
                
                // Status Badge
                val statusColor = when (project.status) {
                    "active" -> MaterialTheme.colorScheme.primary
                    "completed" -> MaterialTheme.colorScheme.secondary
                    "on_hold" -> MaterialTheme.colorScheme.error
                    else -> MaterialTheme.colorScheme.outline
                }
                
                SuggestionChip(
                    onClick = {},
                    label = { Text(project.status.uppercase(), fontSize = 10.sp, fontWeight = FontWeight.Bold) },
                    colors = SuggestionChipDefaults.suggestionChipColors(
                        labelColor = statusColor
                    )
                )
            }

            if (!project.description.isNullOrEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = project.description,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = if (project.category == "client") "Client Project" else "Internal Project",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.secondary
                )
                
                if (!project.githubRepo.isNullOrEmpty()) {
                    Text(
                        text = "🐙 ${project.githubRepo}",
                        fontSize = 11.sp,
                        fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                        color = MaterialTheme.colorScheme.primary
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

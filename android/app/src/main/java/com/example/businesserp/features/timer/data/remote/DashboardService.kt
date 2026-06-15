package com.example.businesserp.features.timer.data.remote

import com.example.businesserp.core.network.ApiResponse
import kotlinx.serialization.Serializable
import retrofit2.http.GET

@Serializable
data class CommitProjectDto(
    val id: String,
    val name: String
)

@Serializable
data class CommitDto(
    val id: String? = null,
    val projectId: String? = null,
    val sha: String,
    val message: String,
    val authorName: String,
    val authorEmail: String,
    val url: String? = null,
    val committedAt: String,
    val project: CommitProjectDto? = null
)

@Serializable
data class DashboardSummaryDto(
    val totalProjects: Int,
    val activeProjects: Int,
    val totalTasks: Int,
    val completedTasks: Int,
    val teamMembers: Int,
    val totalMinutes: Int,
    val latestCommits: List<CommitDto> = emptyList()
)

interface DashboardService {
    @GET("dashboard/summary")
    suspend fun getSummary(): ApiResponse<DashboardSummaryDto>
}

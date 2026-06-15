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
data class UserTaskDto(
    val id: String,
    val title: String
)

@Serializable
data class UserTimeEntryDto(
    val id: String,
    val task: UserTaskDto? = null
)

@Serializable
data class UserDto(
    val id: String,
    val name: String,
    val email: String,
    val timeEntries: List<UserTimeEntryDto> = emptyList()
)

@Serializable
data class ActiveAttendanceDto(
    val id: String,
    val userId: String,
    val checkIn: String,
    val user: UserDto
)

@Serializable
data class DashboardSummaryDto(
    val totalProjects: Int,
    val activeProjects: Int,
    val totalTasks: Int,
    val completedTasks: Int,
    val teamMembers: Int,
    val totalMinutes: Int,
    val latestCommits: List<CommitDto> = emptyList(),
    val activeAttendance: List<ActiveAttendanceDto> = emptyList()
)

interface DashboardService {
    @GET("dashboard/summary")
    suspend fun getSummary(): ApiResponse<DashboardSummaryDto>
}

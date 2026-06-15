package com.example.businesserp.features.tasks.data.remote

import com.example.businesserp.core.network.ApiResponse
import retrofit2.http.*

interface TaskService {
    @GET("tasks")
    suspend fun list(@QueryMap query: Map<String, String>): ApiResponse<com.example.businesserp.core.network.PaginatedList<TaskDto>>

    @GET("tasks/{id}")
    suspend fun get(@Path("id") id: String): ApiResponse<TaskDto>

    @PATCH("tasks/{id}")
    suspend fun updateStatus(
        @Path("id") id: String,
        @Body request: UpdateTaskStatusRequest
    ): ApiResponse<TaskDto>
}

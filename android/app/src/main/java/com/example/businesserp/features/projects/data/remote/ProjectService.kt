package com.example.businesserp.features.projects.data.remote

import com.example.businesserp.core.network.ApiResponse
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.QueryMap

interface ProjectService {
    @GET("projects")
    suspend fun list(@QueryMap query: Map<String, String>): ApiResponse<com.example.businesserp.core.network.PaginatedList<ProjectDto>>

    @GET("projects/{id}")
    suspend fun get(@Path("id") id: String): ApiResponse<ProjectDto>
}

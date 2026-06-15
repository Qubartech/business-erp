package com.example.businesserp.features.timer.data.remote

import com.example.businesserp.core.network.ApiResponse
import retrofit2.http.*

interface TimeEntryService {
    @GET("time-entries")
    suspend fun list(@QueryMap query: Map<String, String>): ApiResponse<com.example.businesserp.core.network.PaginatedList<TimeEntryDto>>

    @GET("time-entries/current")
    suspend fun current(): ApiResponse<TimeEntryDto?>

    @POST("time-entries/start")
    suspend fun start(@Body request: StartTimerRequest): ApiResponse<TimeEntryDto>

    @POST("time-entries/stop")
    suspend fun stop(@Body request: StopTimerRequest): ApiResponse<TimeEntryDto>
}

package com.example.businesserp.features.attendance.data.remote

import com.example.businesserp.core.network.ApiResponse
import retrofit2.http.*

interface AttendanceService {
    @POST("attendance/check-in")
    suspend fun checkIn(): ApiResponse<AttendanceDto>

    @POST("attendance/check-out")
    suspend fun checkOut(): ApiResponse<AttendanceDto>

    @GET("attendance/today")
    suspend fun today(): ApiResponse<AttendanceDto?>

    @GET("attendance")
    suspend fun list(@QueryMap query: Map<String, String>): ApiResponse<com.example.businesserp.core.network.PaginatedList<AttendanceDto>>
}

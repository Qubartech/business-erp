package com.example.businesserp.features.auth.data.remote

import com.example.businesserp.core.network.ApiResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface AuthService {
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): ApiResponse<LoginResponse>

    @POST("auth/logout")
    suspend fun logout(@Body request: LogoutRequest): ApiResponse<Unit?>

    @GET("auth/me")
    suspend fun me(): ApiResponse<UserDto>
}

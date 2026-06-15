package com.example.businesserp.features.auth.data.repository

import com.example.businesserp.core.security.SessionManager
import com.example.businesserp.features.auth.data.remote.AuthService
import com.example.businesserp.features.auth.data.remote.LoginRequest
import com.example.businesserp.features.auth.data.remote.LogoutRequest
import com.example.businesserp.features.auth.domain.model.User
import com.example.businesserp.features.auth.domain.repository.AuthRepository
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val authService: AuthService,
    private val sessionManager: SessionManager
) : AuthRepository {

    override suspend fun login(email: String, password: String): Result<User> {
        return try {
            val response = authService.login(LoginRequest(email, password))
            if (response.success && response.data != null) {
                val data = response.data
                sessionManager.saveSession(
                    token = data.accessToken,
                    refreshToken = data.refreshToken,
                    userId = data.user.id,
                    email = data.user.email,
                    name = data.user.name,
                    role = data.user.role
                )
                Result.success(User(data.user.id, data.user.name, data.user.email, data.user.role))
            } else {
                Result.failure(Exception(response.message ?: "Authentication failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun logout(): Result<Unit> {
        return try {
            val refreshToken = sessionManager.getRefreshToken()
            if (refreshToken != null) {
                try {
                    authService.logout(LogoutRequest(refreshToken))
                } catch (e: Exception) {
                    // Ignore backend logout network failures to guarantee local logout
                }
            }
            sessionManager.clearSession()
            Result.success(Unit)
        } catch (e: Exception) {
            sessionManager.clearSession()
            Result.success(Unit)
        }
    }

    override fun isUserLoggedIn(): Boolean {
        return sessionManager.isLoggedIn()
    }

    override fun getCurrentUser(): User? {
        if (!isUserLoggedIn()) return null
        return User(
            id = sessionManager.getUserId() ?: "",
            name = sessionManager.getUserName() ?: "",
            email = sessionManager.getUserEmail() ?: "",
            role = sessionManager.getUserRole() ?: ""
        )
    }
}

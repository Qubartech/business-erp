package com.example.businesserp.features.auth.domain.repository

import com.example.businesserp.features.auth.domain.model.User

interface AuthRepository {
    suspend fun login(email: String, password: String): Result<User>
    suspend fun logout(): Result<Unit>
    fun isUserLoggedIn(): Boolean
    fun getCurrentUser(): User?
}

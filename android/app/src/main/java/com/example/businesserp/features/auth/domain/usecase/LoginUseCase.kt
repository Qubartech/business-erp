package com.example.businesserp.features.auth.domain.usecase

import com.example.businesserp.features.auth.domain.model.User
import com.example.businesserp.features.auth.domain.repository.AuthRepository
import javax.inject.Inject

class LoginUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(email: String, password: String): Result<User> {
        if (email.isBlank() || password.isBlank()) {
            return Result.failure(Exception("Email and password cannot be empty"))
        }
        return authRepository.login(email, password)
    }
}

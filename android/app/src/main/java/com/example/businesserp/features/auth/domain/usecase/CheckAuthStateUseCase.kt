package com.example.businesserp.features.auth.domain.usecase

import com.example.businesserp.features.auth.domain.model.User
import com.example.businesserp.features.auth.domain.repository.AuthRepository
import javax.inject.Inject

class CheckAuthStateUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    operator fun invoke(): Boolean {
        return authRepository.isUserLoggedIn()
    }

    fun getCurrentUser(): User? {
        return authRepository.getCurrentUser()
    }
}

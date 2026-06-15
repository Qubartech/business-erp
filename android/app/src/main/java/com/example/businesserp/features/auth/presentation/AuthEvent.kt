package com.example.businesserp.features.auth.presentation

sealed interface AuthEvent {
    data class OnEmailChanged(val email: String) : AuthEvent
    data class OnPasswordChanged(val password: String) : AuthEvent
    data object OnLoginClicked : AuthEvent
    data object OnDismissError : AuthEvent
}

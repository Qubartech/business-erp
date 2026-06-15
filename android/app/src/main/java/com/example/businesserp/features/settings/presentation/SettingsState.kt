package com.example.businesserp.features.settings.presentation

data class SettingsState(
    val serverUrl: String = "",
    val userName: String = "",
    val userEmail: String = "",
    val userRole: String = "",
    val isLoggedOut: Boolean = false,
    val isLoading: Boolean = false,
    val successMessage: String? = null,
    val errorMessage: String? = null
)

package com.example.businesserp.features.settings.presentation

sealed interface SettingsEvent {
    data class ServerUrlChanged(val url: String) : SettingsEvent
    data object SaveServerUrl : SettingsEvent
    data object Logout : SettingsEvent
    data object DismissMessages : SettingsEvent
}

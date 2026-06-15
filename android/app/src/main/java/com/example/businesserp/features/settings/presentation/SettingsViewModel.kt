package com.example.businesserp.features.settings.presentation

import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.businesserp.core.security.SessionManager
import com.example.businesserp.features.auth.domain.usecase.LogoutUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val sessionManager: SessionManager,
    private val logoutUseCase: LogoutUseCase,
    @ApplicationContext private val context: Context
) : ViewModel() {

    private val _state = MutableStateFlow(SettingsState())
    val state: StateFlow<SettingsState> = _state.asStateFlow()

    private val settingsPrefs = context.getSharedPreferences("erp_settings_prefs", Context.MODE_PRIVATE)

    init {
        loadSettings()
    }

    private fun loadSettings() {
        val serverUrl = settingsPrefs.getString("backend_url", "http://10.0.2.2:8080/api/") ?: "http://10.0.2.2:8080/api/"
        _state.update {
            it.copy(
                serverUrl = serverUrl,
                userName = sessionManager.getUserName() ?: "",
                userEmail = sessionManager.getUserEmail() ?: "",
                userRole = sessionManager.getUserRole() ?: ""
            )
        }
    }

    fun onEvent(event: SettingsEvent) {
        when (event) {
            is SettingsEvent.ServerUrlChanged -> {
                _state.update { it.copy(serverUrl = event.url, successMessage = null, errorMessage = null) }
            }
            is SettingsEvent.SaveServerUrl -> {
                val url = _state.value.serverUrl
                if (url.isNotBlank() && (url.startsWith("http://") || url.startsWith("https://")) && url.endsWith("/")) {
                    settingsPrefs.edit().putString("backend_url", url).apply()
                    _state.update { it.copy(successMessage = "Server URL saved successfully! Please restart the app to apply.") }
                } else {
                    _state.update { it.copy(errorMessage = "URL must start with http:// or https:// and end with a slash '/'") }
                }
            }
            is SettingsEvent.Logout -> {
                performLogout()
            }
            is SettingsEvent.DismissMessages -> {
                _state.update { it.copy(successMessage = null, errorMessage = null) }
            }
        }
    }

    private fun performLogout() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = logoutUseCase()
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    isLoggedOut = result.isSuccess,
                    errorMessage = result.exceptionOrNull()?.message
                )
            }
        }
    }
}

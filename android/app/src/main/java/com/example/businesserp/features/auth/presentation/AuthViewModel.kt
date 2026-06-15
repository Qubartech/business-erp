package com.example.businesserp.features.auth.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.businesserp.features.auth.domain.usecase.CheckAuthStateUseCase
import com.example.businesserp.features.auth.domain.usecase.LoginUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
    private val checkAuthStateUseCase: CheckAuthStateUseCase
) : ViewModel() {

    private val _state = MutableStateFlow(AuthState())
    val state: StateFlow<AuthState> = _state.asStateFlow()

    init {
        checkAuthentication()
    }

    private fun checkAuthentication() {
        if (checkAuthStateUseCase()) {
            _state.update { it.copy(isAuthenticated = true) }
        }
    }

    fun onEvent(event: AuthEvent) {
        when (event) {
            is AuthEvent.OnEmailChanged -> {
                _state.update { it.copy(email = event.email, errorMessage = null) }
            }
            is AuthEvent.OnPasswordChanged -> {
                _state.update { it.copy(password = event.password, errorMessage = null) }
            }
            is AuthEvent.OnDismissError -> {
                _state.update { it.copy(errorMessage = null) }
            }
            is AuthEvent.OnLoginClicked -> {
                performLogin()
            }
        }
    }

    private fun performLogin() {
        val currentState = _state.value
        val email = currentState.email
        val password = currentState.password

        if (email.isBlank() || password.isBlank()) {
            _state.update { it.copy(errorMessage = "Email and password cannot be empty") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = loginUseCase(email, password)
            _state.update { state ->
                result.fold(
                    onSuccess = {
                        state.copy(isLoading = false, isAuthenticated = true)
                    },
                    onFailure = { error ->
                        state.copy(isLoading = false, errorMessage = error.message ?: "Authentication failed")
                    }
                )
            }
        }
    }
}

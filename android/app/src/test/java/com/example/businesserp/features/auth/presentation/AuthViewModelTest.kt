package com.example.businesserp.features.auth.presentation

import com.example.businesserp.features.auth.domain.model.User
import com.example.businesserp.features.auth.domain.repository.AuthRepository
import com.example.businesserp.features.auth.domain.usecase.CheckAuthStateUseCase
import com.example.businesserp.features.auth.domain.usecase.LoginUseCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class AuthViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    private lateinit var fakeRepository: FakeAuthRepository
    private lateinit var loginUseCase: LoginUseCase
    private lateinit var checkAuthStateUseCase: CheckAuthStateUseCase
    private lateinit var viewModel: AuthViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeRepository = FakeAuthRepository()
        loginUseCase = LoginUseCase(fakeRepository)
        checkAuthStateUseCase = CheckAuthStateUseCase(fakeRepository)
        viewModel = AuthViewModel(loginUseCase, checkAuthStateUseCase)
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun initialState_isEmpty() {
        val state = viewModel.state.value
        assertEquals("", state.email)
        assertEquals("", state.password)
        assertEquals(false, state.isLoading)
        assertEquals(null, state.errorMessage)
        assertEquals(false, state.isAuthenticated)
    }

    @Test
    fun onEmailChanged_updatesEmail() {
        viewModel.onEvent(AuthEvent.OnEmailChanged("test@example.com"))
        assertEquals("test@example.com", viewModel.state.value.email)
    }

    @Test
    fun onPasswordChanged_updatesPassword() {
        viewModel.onEvent(AuthEvent.OnPasswordChanged("secure123"))
        assertEquals("secure123", viewModel.state.value.password)
    }

    @Test
    fun loginSuccess_updatesAuthenticatedState() = runTest(testDispatcher) {
        viewModel.onEvent(AuthEvent.OnEmailChanged("test@example.com"))
        viewModel.onEvent(AuthEvent.OnPasswordChanged("password"))
        
        viewModel.onEvent(AuthEvent.OnLoginClicked)
        
        // Advance coroutines
        advanceUntilIdle()

        val state = viewModel.state.value
        assertEquals(false, state.isLoading)
        assertEquals(true, state.isAuthenticated)
        assertEquals(null, state.errorMessage)
    }

    @Test
    fun loginFailure_updatesErrorState() = runTest(testDispatcher) {
        fakeRepository.loginResult = Result.failure(Exception("Invalid credentials"))
        
        viewModel.onEvent(AuthEvent.OnEmailChanged("test@example.com"))
        viewModel.onEvent(AuthEvent.OnPasswordChanged("wrongpassword"))
        
        viewModel.onEvent(AuthEvent.OnLoginClicked)
        
        advanceUntilIdle()

        val state = viewModel.state.value
        assertEquals(false, state.isLoading)
        assertEquals(false, state.isAuthenticated)
        assertEquals("Invalid credentials", state.errorMessage)
    }

    // Fake Auth Repository for testing
    private class FakeAuthRepository : AuthRepository {
        var loginResult: Result<User> = Result.success(User("1", "Admin", "admin@example.com", "admin"))
        var loggedIn = false

        override suspend fun login(email: String, password: String): Result<User> {
            return loginResult.onSuccess { loggedIn = true }
        }

        override suspend fun logout(): Result<Unit> {
            loggedIn = false
            return Result.success(Unit)
        }

        override fun isUserLoggedIn(): Boolean = loggedIn

        override fun getCurrentUser(): User? = if (loggedIn) User("1", "Admin", "admin@example.com", "admin") else null
    }
}

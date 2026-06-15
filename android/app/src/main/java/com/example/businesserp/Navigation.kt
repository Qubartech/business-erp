package com.example.businesserp

import androidx.compose.runtime.Composable
import androidx.navigation3.runtime.NavKey
import androidx.navigation3.runtime.entryProvider
import androidx.navigation3.runtime.rememberNavBackStack
import androidx.navigation3.ui.NavDisplay
import com.example.businesserp.features.auth.presentation.AuthRootScreen
import com.example.businesserp.ui.main.MainScreen

@Composable
fun MainNavigation(startDestination: NavKey) {
  val backStack = rememberNavBackStack(startDestination)

  NavDisplay(
    backStack = backStack,
    onBack = { backStack.removeLastOrNull() },
    entryProvider =
      entryProvider {
        entry<Login> {
          AuthRootScreen(
            onNavigateToMain = {
              backStack.clear()
              backStack.add(Main)
            }
          )
        }
        entry<Main> {
          MainScreen(
            onNavigateToLogin = {
              backStack.clear()
              backStack.add(Login)
            },
            onNavigateToSettings = {
              backStack.add(SettingsKey)
            }
          )
        }
        entry<SettingsKey> {
          com.example.businesserp.features.settings.presentation.SettingsRootScreen(
            onNavigateToLogin = {
              backStack.clear()
              backStack.add(Login)
            },
            onBack = {
              backStack.removeLastOrNull()
            }
          )
        }
      },
  )
}

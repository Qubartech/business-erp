package com.example.businesserp.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = HrOrange,
    onPrimary = Color.White,
    primaryContainer = Color(0xFF2C160B),
    onPrimaryContainer = Color(0xFFFFD1BD),
    secondary = HrSlateLight,
    onSecondary = Color.White,
    background = Color(0xFF0F172A),
    surface = Color(0xFF1E293B),
    onBackground = Color(0xFFF8FAFC),
    onSurface = Color(0xFFF8FAFC),
    surfaceVariant = Color(0xFF334155),
    onSurfaceVariant = Color(0xFF94A3B8),
    outline = Color(0xFF475569)
)

private val LightColorScheme = lightColorScheme(
    primary = HrOrange,
    onPrimary = Color.White,
    primaryContainer = HrOrangeLight,
    onPrimaryContainer = HrOrangeDark,
    secondary = HrSlateMedium,
    onSecondary = Color.White,
    background = HrBgOffWhite,
    surface = HrSurfaceWhite,
    onBackground = HrSlateDark,
    onSurface = HrSlateDark,
    surfaceVariant = Color(0xFFF1F5F9),
    onSurfaceVariant = HrSlateLight,
    outline = Color(0xFFE2E8F0),
    outlineVariant = Color(0xFFCBD5E1)
)

@Composable
fun BusinessERPTheme(
  darkTheme: Boolean = isSystemInDarkTheme(),
  // Set dynamicColor = false by default to enforce our custom branding
  dynamicColor: Boolean = false,
  content: @Composable () -> Unit,
) {
  val colorScheme =
    when {
      dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
        val context = LocalContext.current
        if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
      }
      darkTheme -> DarkColorScheme
      else -> LightColorScheme
    }

  MaterialTheme(colorScheme = colorScheme, typography = Typography, content = content)
}


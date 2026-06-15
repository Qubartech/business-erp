package com.example.businesserp.core.network

import android.content.Context
import android.content.Intent
import android.util.Log
import com.example.businesserp.MainActivity
import com.example.businesserp.core.security.SessionManager
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import javax.inject.Inject
import javax.inject.Singleton

@Serializable
private data class RefreshRequest(val refreshToken: String)

@Serializable
private data class RefreshResponse(val accessToken: String, val refreshToken: String)

@Singleton
class TokenAuthenticator @Inject constructor(
    private val sessionManager: SessionManager,
    @ApplicationContext private val context: Context
) : Authenticator {

    private val TAG = "TokenAuthenticator"

    override fun authenticate(route: Route?, response: Response): Request? {
        synchronized(this) {
            val currentToken = sessionManager.getJwtToken()
            val requestHeaderToken = response.request.header("Authorization")?.removePrefix("Bearer ")

            // If token has already been updated by another thread, retry immediately
            if (currentToken != null && currentToken != requestHeaderToken) {
                return response.request.newBuilder()
                    .header("Authorization", "Bearer $currentToken")
                    .build()
            }

            val refreshToken = sessionManager.getRefreshToken()
            if (refreshToken == null) {
                handleLogout()
                return null
            }

            // Sync API call to refresh token
            val refreshedTokens = runRefreshTokenCall(refreshToken)
            return if (refreshedTokens != null) {
                sessionManager.updateJwtToken(refreshedTokens.accessToken)
                // If the backend rotates refresh tokens, save the new one
                sessionManager.saveSession(
                    token = refreshedTokens.accessToken,
                    refreshToken = refreshedTokens.refreshToken,
                    userId = sessionManager.getUserId() ?: "",
                    email = sessionManager.getUserEmail() ?: "",
                    name = sessionManager.getUserName() ?: "",
                    role = sessionManager.getUserRole() ?: ""
                )

                response.request.newBuilder()
                    .header("Authorization", "Bearer ${refreshedTokens.accessToken}")
                    .build()
            } else {
                handleLogout()
                null
            }
        }
    }

    private fun runRefreshTokenCall(refreshToken: String): RefreshResponse? {
        try {
            // Get base URL from settings (stored in standard shared prefs)
            val prefs = context.getSharedPreferences("erp_settings_prefs", Context.MODE_PRIVATE)
            val baseUrl = prefs.getString("backend_url", "http://10.0.2.2:8080/api/") ?: "http://10.0.2.2:8080/api/"

            val client = OkHttpClient()
            val mediaType = "application/json; charset=utf-8".toMediaType()
            val json = Json { ignoreUnknownKeys = true }
            
            val requestBodyJson = json.encodeToString(RefreshRequest.serializer(), RefreshRequest(refreshToken))
            val request = Request.Builder()
                .url(baseUrl + "auth/refresh")
                .post(requestBodyJson.toRequestBody(mediaType))
                .build()

            client.newCall(request).execute().use { response ->
                if (response.isSuccessful) {
                    val bodyString = response.body?.string() ?: return null
                    val apiResponse = json.decodeFromString<ApiResponse<RefreshResponse>>(bodyString)
                    return apiResponse.data
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error refreshing token", e)
        }
        return null
    }

    private fun handleLogout() {
        Log.w(TAG, "Refresh token expired or invalid, signing out...")
        sessionManager.clearSession()
        
        // Broadcast or send intent to restart/navigate to auth screen
        val intent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        }
        context.startActivity(intent)
    }
}

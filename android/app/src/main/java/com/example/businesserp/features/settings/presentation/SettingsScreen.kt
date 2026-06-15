package com.example.businesserp.features.settings.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.businesserp.core.components.ErpButton
import com.example.businesserp.core.components.ErpCard
import com.example.businesserp.core.components.ErpErrorView
import com.example.businesserp.core.components.ErpTextField
import com.example.businesserp.theme.BusinessERPTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    state: SettingsState,
    onEvent: (SettingsEvent) -> Unit,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(imageVector = Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.surface)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                // Success / Error messages
                if (state.successMessage != null) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Text(state.successMessage, modifier = Modifier.weight(1f), style = MaterialTheme.typography.bodyMedium.copy(color = MaterialTheme.colorScheme.onPrimaryContainer))
                            IconButton(onClick = { onEvent(SettingsEvent.DismissMessages) }) {
                                Text("✕", color = MaterialTheme.colorScheme.onPrimaryContainer)
                            }
                        }
                    }
                }

                if (state.errorMessage != null) {
                    ErpErrorView(
                        message = state.errorMessage,
                        onDismiss = { onEvent(SettingsEvent.DismissMessages) }
                    )
                }

                // Profile Card
                ErpCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text(
                            text = "USER PROFILE",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            letterSpacing = 0.5.sp
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Text(text = state.userName, fontSize = 22.sp, fontWeight = FontWeight.ExtraBold)
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(text = state.userEmail, fontSize = 14.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        AssistChip(
                            onClick = {},
                            label = { Text(state.userRole.uppercase()) }
                        )
                    }
                }

                // Server URL Config Card
                ErpCard(modifier = Modifier.fillMaxWidth()) {
                    Column(modifier = Modifier.padding(20.dp)) {
                        Text(
                            text = "API CONFIGURATION",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            letterSpacing = 0.5.sp
                        )
                        Spacer(modifier = Modifier.height(16.dp))

                        ErpTextField(
                            value = state.serverUrl,
                            onValueChange = { onEvent(SettingsEvent.ServerUrlChanged(it)) },
                            label = "Backend Base URL",
                            leadingIcon = { Icon(Icons.Default.Settings, contentDescription = null) }
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        ErpButton(
                            text = "Save API URL",
                            onClick = { onEvent(SettingsEvent.SaveServerUrl) }
                        )
                    }
                }

                Spacer(modifier = Modifier.weight(1f))

                // Logout Button
                ErpButton(
                    text = "Sign Out",
                    onClick = { onEvent(SettingsEvent.Logout) },
                    containerColor = MaterialTheme.colorScheme.error,
                    contentColor = MaterialTheme.colorScheme.onError,
                    isLoading = state.isLoading,
                    modifier = Modifier.navigationBarsPadding()
                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun SettingsScreenPreview() {
    BusinessERPTheme {
        SettingsScreen(
            state = SettingsState(
                serverUrl = "http://10.0.2.2:8080/api/",
                userName = "Rafi Qubar",
                userEmail = "rafi@qubartech.com",
                userRole = "admin"
            ),
            onEvent = {},
            onBack = {}
        )
    }
}

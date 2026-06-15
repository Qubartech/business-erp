package com.example.businesserp.features.attendance.presentation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.businesserp.core.components.ErpButton
import com.example.businesserp.core.components.ErpCard
import com.example.businesserp.core.components.ErpErrorView
import com.example.businesserp.core.utils.DateUtils
import com.example.businesserp.features.attendance.domain.model.Attendance
import com.example.businesserp.theme.BusinessERPTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AttendanceHistoryScreen(
    state: AttendanceHistoryState,
    onEvent: (AttendanceHistoryEvent) -> Unit,
    onNavigateToSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    val isCheckedIn = state.activeAttendance != null
    val statusText = if (isCheckedIn) "Checked In" else "Checked Out"
    val statusColor = if (isCheckedIn) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Attendance", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { onEvent(AttendanceHistoryEvent.RefreshAttendance) }) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(imageVector = Icons.Default.Settings, contentDescription = "Settings")
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
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(bottom = 24.dp, top = 8.dp)
            ) {
                if (state.errorMessage != null) {
                    item {
                        ErpErrorView(
                            message = state.errorMessage,
                            onDismiss = { onEvent(AttendanceHistoryEvent.DismissError) }
                        )
                    }
                }

                // Banner Status
                item {
                    ErpCard(modifier = Modifier.fillMaxWidth()) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        text = "TODAY'S STATUS",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        letterSpacing = 0.5.sp
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = statusText,
                                        fontSize = 24.sp,
                                        fontWeight = FontWeight.ExtraBold,
                                        color = statusColor
                                    )
                                }
                                
                                Box(
                                    modifier = Modifier
                                        .size(16.dp)
                                        .clip(CircleShape)
                                        .background(statusColor)
                                )
                            }

                            if (isCheckedIn && state.activeAttendance != null) {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Checked In at ${DateUtils.formatTime(state.activeAttendance.checkIn)}",
                                    fontSize = 14.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }

                            Spacer(modifier = Modifier.height(20.dp))

                            if (!isCheckedIn) {
                                ErpButton(
                                    text = "Check In Today",
                                    onClick = { onEvent(AttendanceHistoryEvent.CheckIn) },
                                    containerColor = MaterialTheme.colorScheme.primary
                                )
                            } else {
                                ErpButton(
                                    text = "Check Out Now",
                                    onClick = { onEvent(AttendanceHistoryEvent.CheckOut) },
                                    containerColor = MaterialTheme.colorScheme.error,
                                    contentColor = MaterialTheme.colorScheme.onError
                                )
                            }
                        }
                    }
                }

                // History Title
                item {
                    Text(
                        text = "Attendance Logs",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }

                // History List
                if (state.attendanceHistory.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    text = "No history recorded.",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                } else {
                    items(state.attendanceHistory) { record ->
                        AttendanceHistoryRow(record = record)
                    }
                }
            }

            if (state.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            }
        }
    }
}

@Composable
fun AttendanceHistoryRow(record: Attendance) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = DateUtils.formatDate(record.checkIn),
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                val inText = DateUtils.formatTime(record.checkIn)
                val outText = record.checkOut?.let { DateUtils.formatTime(it) } ?: "Active"
                Text(
                    text = "In: $inText | Out: $outText",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            if (record.checkOut != null) {
                val durationMinutes = ((record.checkOut - record.checkIn) / 60000).toInt()
                Text(
                    text = DateUtils.formatDuration(durationMinutes),
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.primary
                )
            } else {
                Text(
                    text = "On-going",
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun AttendanceHistoryScreenPreview() {
    BusinessERPTheme {
        AttendanceHistoryScreen(
            state = AttendanceHistoryState(
                attendanceHistory = listOf(
                    Attendance("1", "user1", System.currentTimeMillis() - 8 * 3600000, System.currentTimeMillis() - 3600000, System.currentTimeMillis(), System.currentTimeMillis()),
                    Attendance("2", "user1", System.currentTimeMillis() - 32 * 3600000, System.currentTimeMillis() - 24 * 3600000, System.currentTimeMillis(), System.currentTimeMillis())
                )
            ),
            onEvent = {},
            onNavigateToSettings = {}
        )
    }
}

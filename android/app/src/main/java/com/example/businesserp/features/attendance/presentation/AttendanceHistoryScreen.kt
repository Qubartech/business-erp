package com.example.businesserp.features.attendance.presentation

import androidx.compose.foundation.BorderStroke
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
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.businesserp.core.components.ErpButton
import com.example.businesserp.core.components.ErpCard
import com.example.businesserp.core.components.ErpErrorView
import com.example.businesserp.core.utils.DateUtils
import com.example.businesserp.features.attendance.domain.model.Attendance
import com.example.businesserp.theme.*

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
    val statusColor = if (isCheckedIn) HrGreenPresent else HrRedLeave

    var selectedTab by remember { mutableStateOf(0) }
    val isAdmin = state.userRole == "admin"

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Attendance Logs", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { onEvent(AttendanceHistoryEvent.RefreshAttendance) }) {
                        Icon(imageVector = Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    IconButton(onClick = onNavigateToSettings) {
                        Icon(imageVector = Icons.Default.Settings, contentDescription = "Settings")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.background
                )
            )
        },
        modifier = modifier
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(MaterialTheme.colorScheme.background)
        ) {
            if (isAdmin) {
                TabRow(
                    selectedTabIndex = selectedTab,
                    containerColor = MaterialTheme.colorScheme.background,
                    contentColor = HrPrimary,
                    indicator = { tabPositions ->
                        TabRowDefaults.SecondaryIndicator(
                            Modifier.tabIndicatorOffset(tabPositions[selectedTab]),
                            color = HrPrimary
                        )
                    }
                ) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("My Attendance", fontWeight = FontWeight.Bold) },
                        selectedContentColor = HrPrimary,
                        unselectedContentColor = HrSlateLight
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Team Tracker", fontWeight = FontWeight.Bold) },
                        selectedContentColor = HrPrimary,
                        unselectedContentColor = HrSlateLight
                    )
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .weight(1f)
            ) {
                if (selectedTab == 0 || !isAdmin) {
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

                        // Banner Status Card
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
                                                color = HrSlateLight,
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

                                    if (state.activeAttendance != null) {
                                        Spacer(modifier = Modifier.height(8.dp))
                                        Text(
                                            text = "Checked In at ${DateUtils.formatTime(state.activeAttendance.checkIn)}",
                                            fontSize = 14.sp,
                                            color = HrSlateMedium,
                                            fontWeight = FontWeight.Medium
                                        )
                                    }

                                    Spacer(modifier = Modifier.height(20.dp))

                                    if (!isCheckedIn) {
                                        ErpButton(
                                            text = "Check In Today",
                                            onClick = { onEvent(AttendanceHistoryEvent.CheckIn) },
                                            containerColor = HrPrimary
                                        )
                                    } else {
                                        ErpButton(
                                            text = "Check Out Now",
                                            onClick = { onEvent(AttendanceHistoryEvent.CheckOut) },
                                            containerColor = HrRedLeave,
                                            contentColor = Color.White
                                        )
                                    }
                                }
                            }
                        }

                        // History Title
                        item {
                            Text(
                                text = "Recent Attendance Logs",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = HrSlateDark,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                        }

                        // History List
                        if (state.attendanceHistory.isEmpty()) {
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(24.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "No history recorded.",
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            fontSize = 14.sp
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
                } else {
                    // Team Tracker Tab
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

                        item {
                            Text(
                                text = "Checked-in Team Members",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = HrSlateDark,
                                modifier = Modifier.padding(top = 8.dp)
                            )
                        }

                        if (state.activeTeamMembers.isEmpty()) {
                            item {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(16.dp),
                                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                    border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(24.dp),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(
                                            text = "No team members are currently checked in.",
                                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                                            fontSize = 14.sp
                                        )
                                    }
                                }
                            }
                        } else {
                            items(state.activeTeamMembers) { member ->
                                TeamMemberActiveCard(member = member)
                            }
                        }
                    }
                }

                if (state.isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center),
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
        }
    }
}

@Composable
fun TeamMemberActiveCard(member: ActiveTeamMember) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(HrPrimaryLight),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = member.userName.take(2).uppercase(),
                    color = HrPrimary,
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = member.userName,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = HrSlateDark
                )
                Text(
                    text = member.userEmail,
                    fontSize = 12.sp,
                    color = HrSlateLight
                )
                Spacer(modifier = Modifier.height(4.dp))
                
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(8.dp)
                            .clip(CircleShape)
                            .background(HrGreenPresent)
                    )
                    Spacer(modifier = Modifier.width(6.dp))
                    Text(
                        text = "In: ${DateUtils.formatTime(member.checkInTime)}",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = HrGreenPresent
                    )
                }
            }

            Spacer(modifier = Modifier.width(8.dp))

            if (member.activeTaskTitle != null) {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(HrPrimaryLight)
                        .padding(horizontal = 8.dp, vertical = 6.dp)
                        .widthIn(max = 120.dp)
                ) {
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "WORKING ON",
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 8.sp,
                            color = HrPrimary
                        )
                        Text(
                            text = member.activeTaskTitle,
                            fontWeight = FontWeight.Bold,
                            fontSize = 10.sp,
                            color = HrSlateDark,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            } else {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(HrSlateLight.copy(alpha = 0.1f))
                        .padding(horizontal = 8.dp, vertical = 6.dp)
                ) {
                    Text(
                        text = "IDLE",
                        fontWeight = FontWeight.Bold,
                        fontSize = 10.sp,
                        color = HrSlateLight
                    )
                }
            }
        }
    }
}

@Composable
fun AttendanceHistoryRow(record: Attendance) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.5f))
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
                    color = HrSlateDark
                )
                Spacer(modifier = Modifier.height(4.dp))
                val inText = DateUtils.formatTime(record.checkIn)
                val outText = record.checkOut?.let { DateUtils.formatTime(it) } ?: "Active"
                Text(
                    text = "In: $inText | Out: $outText",
                    fontSize = 12.sp,
                    color = HrSlateLight,
                    fontWeight = FontWeight.Medium
                )
            }
            
            if (record.checkOut != null) {
                val durationMinutes = ((record.checkOut - record.checkIn) / 60000).toInt()
                Text(
                    text = DateUtils.formatDuration(durationMinutes),
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 14.sp,
                    color = HrPrimary
                )
            } else {
                Box(
                    modifier = Modifier
                        .clip(RoundedCornerShape(8.dp))
                        .background(HrGreenPresentBg)
                        .padding(horizontal = 8.dp, vertical = 4.dp)
                ) {
                    Text(
                        text = "ON-GOING",
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 10.sp,
                        color = HrGreenPresent
                    )
                }
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

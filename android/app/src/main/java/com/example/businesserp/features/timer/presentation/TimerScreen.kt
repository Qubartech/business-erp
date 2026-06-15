package com.example.businesserp.features.timer.presentation

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
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
import com.example.businesserp.features.timer.domain.model.TimeEntry
import com.example.businesserp.theme.BusinessERPTheme
import kotlinx.coroutines.delay

sealed interface ActivityItem {
    val id: String
    val timestamp: Long

    data class Timer(val entry: TimeEntry) : ActivityItem {
        override val id: String = entry.id
        override val timestamp: Long = entry.startTime
    }

    data class Commit(val commit: com.example.businesserp.features.timer.domain.model.Commit) : ActivityItem {
        override val id: String = commit.sha
        override val timestamp: Long = commit.committedAt
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimerScreen(
    state: TimerState,
    onEvent: (TimerEvent) -> Unit,
    onNavigateToSettings: () -> Unit,
    modifier: Modifier = Modifier
) {
    val activityItems = remember(state.timeEntries, state.commits) {
        val timers = state.timeEntries.map { ActivityItem.Timer(it) }
        val commits = state.commits.map { ActivityItem.Commit(it) }
        (timers + commits).sortedByDescending { it.timestamp }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Dashboard", fontWeight = FontWeight.Bold) },
                actions = {
                    IconButton(onClick = { onEvent(TimerEvent.RefreshStatus) }) {
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
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Error display
                if (state.errorMessage != null) {
                    item {
                        ErpErrorView(
                            message = state.errorMessage,
                            onDismiss = { onEvent(TimerEvent.DismissError) },
                            modifier = Modifier.padding(top = 8.dp)
                        )
                    }
                }

                // Attendance Status Card
                item {
                    AttendanceSection(
                        activeAttendance = state.activeAttendance,
                        onCheckIn = { onEvent(TimerEvent.CheckIn) },
                        onCheckOut = { onEvent(TimerEvent.CheckOut) }
                    )
                }

                // Active Timer Card
                item {
                    ActiveTimerSection(
                        activeTimer = state.activeTimer,
                        onStopTimer = { onEvent(TimerEvent.StopTimer(it)) }
                    )
                }

                // Recent Activity Title
                item {
                    Text(
                        text = "Recent Activity",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }

                // Recent activity list
                if (activityItems.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f))
                        ) {
                            Box(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(24.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                Text("No recent activities. Select a task to start tracking or push commits to sync.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                    }
                } else {
                    items(activityItems.take(7)) { item ->
                        when (item) {
                            is ActivityItem.Timer -> TimeEntryRow(entry = item.entry)
                            is ActivityItem.Commit -> CommitRow(commit = item.commit)
                        }
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
fun AttendanceSection(
    activeAttendance: Attendance?,
    onCheckIn: () -> Unit,
    onCheckOut: () -> Unit
) {
    val isCheckedIn = activeAttendance != null
    val statusText = if (isCheckedIn) "Checked In" else "Checked Out"
    val statusColor = if (isCheckedIn) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error

    ErpCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "ATTENDANCE STATUS",
                        fontSize = 12.sp,
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
                
                // Status Indicator
                Box(
                    modifier = Modifier
                        .size(16.dp)
                        .clip(CircleShape)
                        .background(statusColor)
                )
            }

            if (isCheckedIn && activeAttendance != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Checked In at ${DateUtils.formatTime(activeAttendance.checkIn)}",
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            if (!isCheckedIn) {
                ErpButton(
                    text = "Check In Today",
                    onClick = onCheckIn,
                    containerColor = MaterialTheme.colorScheme.primary
                )
            } else {
                ErpButton(
                    text = "Check Out Now",
                    onClick = onCheckOut,
                    containerColor = MaterialTheme.colorScheme.error,
                    contentColor = MaterialTheme.colorScheme.onError
                )
            }
        }
    }
}
@Composable
fun ActiveTimerSection(
    activeTimer: TimeEntry?,
    onStopTimer: (String) -> Unit
) {
    if (activeTimer == null) return

    var elapsedSeconds by remember(activeTimer.id) {
        mutableLongStateOf((System.currentTimeMillis() - activeTimer.startTime) / 1000)
    }

    LaunchedEffect(activeTimer.id) {
        while (true) {
            delay(1000)
            elapsedSeconds = (System.currentTimeMillis() - activeTimer.startTime) / 1000
        }
    }

    val hours = elapsedSeconds / 3600
    val minutes = (elapsedSeconds % 3600) / 60
    val seconds = elapsedSeconds % 60
    val timeString = String.format("%02d:%02d:%02d", hours, minutes, seconds)

    ErpCard(
        modifier = Modifier.fillMaxWidth(),
        backgroundColor = MaterialTheme.colorScheme.secondaryContainer
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "ACTIVE TIMER",
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = activeTimer.taskTitle ?: "Task: ${activeTimer.taskId.take(8)}...",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSecondaryContainer,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                
                CircularProgressIndicator(
                    modifier = Modifier.size(16.dp),
                    strokeWidth = 2.dp,
                    color = MaterialTheme.colorScheme.primary
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = timeString,
                fontSize = 42.sp,
                fontWeight = FontWeight.ExtraBold,
                color = MaterialTheme.colorScheme.onSecondaryContainer,
                letterSpacing = 1.sp
            )

            Spacer(modifier = Modifier.height(16.dp))

            ErpButton(
                text = "Stop Tracking",
                onClick = { onStopTimer(activeTimer.id) },
                containerColor = MaterialTheme.colorScheme.error,
                contentColor = MaterialTheme.colorScheme.onError
            )
        }
    }
}

@Composable
fun TimeEntryRow(entry: TimeEntry) {
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
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = entry.taskTitle ?: "Task: ${entry.taskId.take(8)}...",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${DateUtils.formatDate(entry.startTime)} | ${DateUtils.formatTime(entry.startTime)}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            val durationText = if (entry.endTime != null) {
                DateUtils.formatDuration(entry.durationMinutes)
            } else {
                "Running..."
            }
            
            Text(
                text = durationText,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = if (entry.endTime == null) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
fun CommitRow(commit: com.example.businesserp.features.timer.domain.model.Commit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.15f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Text("Git", fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, fontSize = 12.sp)
            }

            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = commit.projectName,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = commit.sha.take(7),
                        fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace,
                        fontSize = 11.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = commit.message,
                    fontWeight = FontWeight.SemiBold,
                    fontSize = 14.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "by ${commit.authorName} | ${DateUtils.formatDate(commit.committedAt)}",
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Preview(showBackground = true)
@Composable
private fun TimerScreenCheckedOutPreview() {
    BusinessERPTheme {
        TimerScreen(
            state = TimerState(
                activeAttendance = null,
                activeTimer = null
            ),
            onEvent = {},
            onNavigateToSettings = {}
        )
    }
}

@Preview(showBackground = true)
@Composable
private fun TimerScreenCheckedInPreview() {
    BusinessERPTheme {
        TimerScreen(
            state = TimerState(
                activeAttendance = Attendance("1", "user1", System.currentTimeMillis() - 3600000, null, System.currentTimeMillis(), System.currentTimeMillis()),
                activeTimer = TimeEntry("1", "task1", "user1", System.currentTimeMillis() - 1800000, null, null, System.currentTimeMillis())
            ),
            onEvent = {},
            onNavigateToSettings = {}
        )
    }
}

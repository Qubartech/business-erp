package com.example.businesserp.features.timer.presentation

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.List
import androidx.compose.material.icons.filled.Folder
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.People
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
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
import com.example.businesserp.theme.*
import kotlinx.coroutines.delay

@Composable
fun TimerScreen(
    state: TimerState,
    onEvent: (TimerEvent) -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToTabName: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    // Group time entries by taskId to combine multiple sprints of the same task
    val groupedTimeEntries = remember(state.timeEntries) {
        state.timeEntries
            .groupBy { it.taskId }
            .map { (taskId, entries) ->
                val latestStartTime = entries.maxOfOrNull { it.startTime } ?: 0L
                val totalDuration = entries.sumOf { it.durationMinutes ?: 0 }
                val taskTitle = entries.firstOrNull { !it.taskTitle.isNullOrEmpty() }?.taskTitle
                
                TimeEntry(
                    id = entries.first().id,
                    taskId = taskId,
                    userId = entries.first().userId,
                    startTime = latestStartTime,
                    endTime = entries.first().endTime,
                    durationMinutes = totalDuration,
                    createdAt = entries.first().createdAt,
                    taskTitle = taskTitle
                )
            }
            .sortedByDescending { it.startTime }
    }

    Scaffold(
        modifier = modifier
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                // Only pad the bottom (navigation bar height) to allow the header background to flow under status bar
                .padding(bottom = paddingValues.calculateBottomPadding())
                .background(MaterialTheme.colorScheme.background)
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // App Header & Hero Card
                item {
                    DashboardHeader(
                        isCheckedIn = state.activeAttendance != null,
                        userName = state.userName,
                        totalProjects = state.totalProjects,
                        totalTasks = state.totalTasks,
                        teamMembers = state.teamMembers,
                        checkedInCount = state.checkedInCount,
                        onCheckInToggle = {
                            if (state.activeAttendance != null) {
                                onEvent(TimerEvent.CheckOut)
                            } else {
                                onEvent(TimerEvent.CheckIn)
                            }
                        },
                        onRefresh = { onEvent(TimerEvent.RefreshStatus) },
                        onNavigateToSettings = onNavigateToSettings,
                        onNavigateToTabName = onNavigateToTabName
                    )
                }

                // Core Dashboard Content
                item {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Error display
                        if (state.errorMessage != null) {
                            ErpErrorView(
                                message = state.errorMessage,
                                onDismiss = { onEvent(TimerEvent.DismissError) }
                            )
                        }

                        // Active Timer Section
                        ActiveTimerSection(
                            activeTimer = state.activeTimer,
                            onStopTimer = { onEvent(TimerEvent.StopTimer(it)) }
                        )

                        // My Attendance Section (Check in/out display)
                        MyAttendanceSection(
                            activeAttendance = state.activeAttendance,
                            attendanceHistory = state.attendanceHistory
                        )

                        // Attendance Details Stats Section
                        AttendanceStatsSection(
                            attendanceCount = state.attendanceHistory.size,
                            timeEntriesCount = state.timeEntries.size
                        )
                    }
                }

                // Separated Recent Tasks Section
                item {
                    Text(
                        text = "Recent Tasks",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = HrSlateDark,
                        modifier = Modifier.padding(top = 8.dp, start = 16.dp, end = 16.dp)
                    )
                }

                if (groupedTimeEntries.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
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
                                    text = "No recent tracked tasks.",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                } else {
                    items(groupedTimeEntries.take(3)) { entry ->
                        Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                            TimeEntryRow(entry = entry)
                        }
                    }
                }

                // Separated Recent Git Commits Section
                item {
                    Text(
                        text = "Recent Git Commits",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = HrSlateDark,
                        modifier = Modifier.padding(top = 8.dp, start = 16.dp, end = 16.dp)
                    )
                }

                if (state.commits.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp),
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
                                    text = "No recent commits synced.",
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                        }
                    }
                } else {
                    items(state.commits.take(3)) { commit ->
                        Box(modifier = Modifier.padding(horizontal = 16.dp)) {
                            CommitRow(commit = commit)
                        }
                    }
                }

                // Bottom spacer padding
                item {
                    Spacer(modifier = Modifier.height(16.dp))
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

@Composable
fun DashboardHeader(
    isCheckedIn: Boolean,
    userName: String,
    totalProjects: Int?,
    totalTasks: Int?,
    teamMembers: Int?,
    checkedInCount: Int?,
    onCheckInToggle: () -> Unit,
    onRefresh: () -> Unit,
    onNavigateToSettings: () -> Unit,
    onNavigateToTabName: (String) -> Unit
) {
    val formattedDate = remember {
        val sdf = java.text.SimpleDateFormat("EEE, dd MMM yyyy", java.util.Locale.getDefault())
        sdf.format(java.util.Date())
    }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .padding(top = 12.dp, bottom = 8.dp)
    ) {
        // App Header: Qubartech ERP and Refresh/Settings Icons
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 20.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Qubartech ERP",
                color = HrSlateDark,
                fontSize = 22.sp,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = 0.5.sp
            )
            
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                IconButton(
                    onClick = onRefresh,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Icon(
                        imageVector = Icons.Default.Refresh,
                        contentDescription = "Refresh",
                        tint = HrSlateDark,
                        modifier = Modifier.size(18.dp)
                    )
                }
                
                IconButton(
                    onClick = onNavigateToSettings,
                    modifier = Modifier
                        .size(36.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                ) {
                    Icon(
                        imageVector = Icons.Default.Settings,
                        contentDescription = "Settings",
                        tint = HrSlateDark,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Hero Card (Royal Purple Minimalist Card)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.Transparent),
            elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        brush = Brush.verticalGradient(
                            colors = listOf(Color(0xFF5F3DC4), Color(0xFF7048E8))
                        )
                    )
                    .padding(20.dp)
            ) {
                Column {
                    // Row 1: Welcome message, Date & Check In toggle
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Top
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "Welcome, $userName",
                                color = Color.White,
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = formattedDate,
                                color = Color.White.copy(alpha = 0.7f),
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium
                            )
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        // Toggle Button Card inside the Hero Card
                        Card(
                            shape = RoundedCornerShape(24.dp),
                            colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.2f)),
                            elevation = CardDefaults.cardElevation(defaultElevation = 0.dp),
                            border = BorderStroke(1.dp, Color.White.copy(alpha = 0.2f))
                        ) {
                            Row(
                                modifier = Modifier
                                    .clickable { onCheckInToggle() }
                                    .padding(horizontal = 12.dp, vertical = 6.dp),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = if (isCheckedIn) "Checked In" else "Check In",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Box(
                                    modifier = Modifier
                                        .width(28.dp)
                                        .height(16.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .background(if (isCheckedIn) HrGreenPresent else Color.White.copy(alpha = 0.3f)),
                                    contentAlignment = if (isCheckedIn) Alignment.CenterEnd else Alignment.CenterStart
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .padding(2.dp)
                                            .size(12.dp)
                                            .clip(CircleShape)
                                            .background(Color.White)
                                    )
                                }
                            }
                        }
                    }

                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = 16.dp),
                        color = Color.White.copy(alpha = 0.15f)
                    )

                    // Row 2: Stats Grid inside the Hero Card
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        StatColumnItem(
                            count = totalProjects?.let { String.format("%02d", it) } ?: "--",
                            label = "Projects",
                            loading = totalProjects == null,
                            onClick = { onNavigateToTabName("Projects") }
                        )
                        VerticalDivider(
                            color = Color.White.copy(alpha = 0.15f),
                            modifier = Modifier.height(30.dp)
                        )
                        StatColumnItem(
                            count = totalTasks?.let { String.format("%02d", it) } ?: "--",
                            label = "Tasks",
                            loading = totalTasks == null,
                            onClick = { onNavigateToTabName("Tasks") }
                        )
                        VerticalDivider(
                            color = Color.White.copy(alpha = 0.15f),
                            modifier = Modifier.height(30.dp)
                        )
                        StatColumnItem(
                            count = teamMembers?.let { String.format("%02d", it) } ?: "--",
                            label = "Members",
                            loading = teamMembers == null,
                            onClick = { onNavigateToTabName("Attendance") }
                        )
                        VerticalDivider(
                            color = Color.White.copy(alpha = 0.15f),
                            modifier = Modifier.height(30.dp)
                        )
                        StatColumnItem(
                            count = checkedInCount?.let { String.format("%02d", it) } ?: "--",
                            label = "In Office",
                            loading = checkedInCount == null,
                            onClick = { onNavigateToTabName("Attendance") }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun RowScope.StatColumnItem(
    count: String,
    label: String,
    loading: Boolean,
    onClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .weight(1f)
            .clickable(enabled = !loading) { onClick() },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(16.dp),
                strokeWidth = 2.dp,
                color = Color.White
            )
        } else {
            Text(
                text = count,
                fontSize = 20.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Color.White
            )
        }
        Spacer(modifier = Modifier.height(2.dp))
        Text(
            text = label,
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = Color.White.copy(alpha = 0.7f)
        )
    }
}

@Composable
fun MyAttendanceSection(
    activeAttendance: Attendance?,
    attendanceHistory: List<Attendance>
) {
    val checkInTime = activeAttendance?.let { DateUtils.formatTime(it.checkIn) } ?: "--:--"
    val checkOutTime = if (activeAttendance == null && attendanceHistory.isNotEmpty()) {
        val last = attendanceHistory.first()
        if (last.checkOut != null) DateUtils.formatTime(last.checkOut) else "--:--"
    } else {
        "--:--"
    }

    Column {
        Text(
            text = "My Attendance",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = HrSlateDark,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Check In Card
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(20.dp),
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
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(HrGreenPresentBg),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = null,
                            tint = HrGreenPresent,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "Checked In",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = checkInTime,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = HrSlateDark
                        )
                    }
                }
            }

            // Check Out Card
            Card(
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(20.dp),
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
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(HrRedLeaveBg),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.PlayArrow,
                            contentDescription = null,
                            tint = HrRedLeave,
                            modifier = Modifier.size(18.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = "Checked Out",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = checkOutTime,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.ExtraBold,
                            color = HrSlateDark
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AttendanceStatsSection(
    attendanceCount: Int,
    timeEntriesCount: Int
) {
    Column {
        Text(
            text = "Attendance Details",
            fontSize = 16.sp,
            fontWeight = FontWeight.Bold,
            color = HrSlateDark,
            modifier = Modifier.padding(bottom = 12.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Present
            StatCard(
                count = if (attendanceCount > 0) String.format("%02d", attendanceCount) else "15",
                label = "Present",
                bgColor = HrGreenPresentBg,
                contentColor = HrGreenPresent,
                modifier = Modifier.weight(1f)
            )

            // Leave
            StatCard(
                count = "04",
                label = "Leave",
                bgColor = HrRedLeaveBg,
                contentColor = HrRedLeave,
                modifier = Modifier.weight(1f)
            )

            // Overtime
            StatCard(
                count = if (timeEntriesCount > 0) String.format("%02d", timeEntriesCount) else "01",
                label = "Overtime",
                bgColor = HrYellowOvertimeBg,
                contentColor = HrYellowOvertime,
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun StatCard(
    count: String,
    label: String,
    bgColor: Color,
    contentColor: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = bgColor)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = count,
                fontSize = 20.sp,
                fontWeight = FontWeight.ExtraBold,
                color = contentColor
            )
            Spacer(modifier = Modifier.height(2.dp))
            Text(
                text = label,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                color = contentColor.copy(alpha = 0.8f)
            )
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

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = HrOrangeLight),
        border = BorderStroke(1.dp, HrOrange.copy(alpha = 0.4f))
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
                        color = HrOrangeDark.copy(alpha = 0.8f)
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = activeTimer.taskTitle ?: "Task: ${activeTimer.taskId.take(8)}...",
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = HrSlateDark,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                
                CircularProgressIndicator(
                    modifier = Modifier.size(16.dp),
                    strokeWidth = 2.dp,
                    color = HrOrange
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = timeString,
                fontSize = 42.sp,
                fontWeight = FontWeight.ExtraBold,
                color = HrOrangeDark,
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
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = entry.taskTitle ?: "Task: ${entry.taskId.take(8)}...",
                    fontWeight = FontWeight.Bold,
                    fontSize = 14.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    color = HrSlateDark
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${DateUtils.formatDate(entry.startTime)} | ${DateUtils.formatTime(entry.startTime)}",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            val durationText = if (entry.endTime != null || entry.durationMinutes != null) {
                DateUtils.formatDuration(entry.durationMinutes ?: 0)
            } else {
                "Running..."
            }
            
            Text(
                text = durationText,
                fontWeight = FontWeight.Bold,
                fontSize = 14.sp,
                color = HrSlateDark
            )
        }
    }
}

@Composable
fun CommitRow(commit: com.example.businesserp.features.timer.domain.model.Commit) {
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
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .background(HrOrangeLight),
                contentAlignment = Alignment.Center
            ) {
                Text("Git", fontWeight = FontWeight.Bold, color = HrOrange, fontSize = 12.sp)
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
                        color = HrOrange
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
                    color = HrSlateDark,
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
            onNavigateToSettings = {},
            onNavigateToTabName = {}
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
            onNavigateToSettings = {},
            onNavigateToTabName = {}
        )
    }
}

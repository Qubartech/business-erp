package com.example.businesserp.features.timer.presentation

import com.example.businesserp.features.attendance.domain.model.Attendance
import com.example.businesserp.features.attendance.domain.repository.AttendanceRepository
import com.example.businesserp.features.attendance.domain.usecase.CheckInUseCase
import com.example.businesserp.features.attendance.domain.usecase.CheckOutUseCase
import com.example.businesserp.features.attendance.domain.usecase.GetTodayAttendanceUseCase
import com.example.businesserp.features.timer.domain.model.TimeEntry
import com.example.businesserp.features.timer.domain.repository.TimeEntryRepository
import com.example.businesserp.features.timer.domain.usecase.GetRunningTimerUseCase
import com.example.businesserp.features.timer.domain.usecase.StartTimerUseCase
import com.example.businesserp.features.timer.domain.usecase.StopTimerUseCase
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.*
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class TimerViewModelTest {

    private val testDispatcher = StandardTestDispatcher()

    private lateinit var fakeTimeRepo: FakeTimeEntryRepository
    private lateinit var fakeAttendanceRepo: FakeAttendanceRepository

    private lateinit var startTimerUseCase: StartTimerUseCase
    private lateinit var stopTimerUseCase: StopTimerUseCase
    private lateinit var getRunningTimerUseCase: GetRunningTimerUseCase
    private lateinit var checkInUseCase: CheckInUseCase
    private lateinit var checkOutUseCase: CheckOutUseCase
    private lateinit var getTodayAttendanceUseCase: GetTodayAttendanceUseCase

    private lateinit var fakeDashboardService: FakeDashboardService
    private lateinit var fakeCommitDao: FakeCommitDao
    private lateinit var sessionManager: com.example.businesserp.core.security.SessionManager

    private lateinit var viewModel: TimerViewModel

    @Before
    fun setUp() {
        Dispatchers.setMain(testDispatcher)
        fakeTimeRepo = FakeTimeEntryRepository()
        fakeAttendanceRepo = FakeAttendanceRepository()
        fakeDashboardService = FakeDashboardService()
        fakeCommitDao = FakeCommitDao()

        sessionManager = org.mockito.kotlin.mock()
        org.mockito.kotlin.whenever(sessionManager.getUserName()).thenReturn("Test User")
        org.mockito.kotlin.whenever(sessionManager.getUserId()).thenReturn("user1")

        startTimerUseCase = StartTimerUseCase(fakeTimeRepo)
        stopTimerUseCase = StopTimerUseCase(fakeTimeRepo)
        getRunningTimerUseCase = GetRunningTimerUseCase(fakeTimeRepo)
        checkInUseCase = CheckInUseCase(fakeAttendanceRepo)
        checkOutUseCase = CheckOutUseCase(fakeAttendanceRepo)
        getTodayAttendanceUseCase = GetTodayAttendanceUseCase(fakeAttendanceRepo)

        viewModel = TimerViewModel(
            startTimerUseCase,
            stopTimerUseCase,
            getRunningTimerUseCase,
            checkInUseCase,
            checkOutUseCase,
            getTodayAttendanceUseCase,
            fakeTimeRepo,
            fakeAttendanceRepo,
            fakeDashboardService,
            fakeCommitDao,
            sessionManager
        )
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    @Test
    fun initialState_isCorrect() {
        val state = viewModel.state.value
        assertEquals(null, state.activeTimer)
        assertEquals(null, state.activeAttendance)
        assertEquals(emptyList<TimeEntry>(), state.timeEntries)
        assertEquals(emptyList<Attendance>(), state.attendanceHistory)
        assertEquals(false, state.isLoading)
        assertEquals(null, state.errorMessage)
    }

    @Test
    fun checkIn_updatesActiveAttendance() = runTest(testDispatcher) {
        viewModel.onEvent(TimerEvent.CheckIn)
        advanceUntilIdle()

        val state = viewModel.state.value
        assertEquals(false, state.isLoading)
        assertEquals("att1", state.activeAttendance?.id)
        assertEquals(null, state.errorMessage)
    }

    @Test
    fun startTimer_updatesActiveTimer() = runTest(testDispatcher) {
        viewModel.onEvent(TimerEvent.StartTimer("task123"))
        advanceUntilIdle()

        val state = viewModel.state.value
        assertEquals(false, state.isLoading)
        assertEquals("time1", state.activeTimer?.id)
        assertEquals("task123", state.activeTimer?.taskId)
        assertEquals(null, state.errorMessage)
    }

    private class FakeTimeEntryRepository : TimeEntryRepository {
        private val listFlow = MutableStateFlow<List<TimeEntry>>(emptyList())
        private val runningFlow = MutableStateFlow<TimeEntry?>(null)

        override fun getAllTimeEntriesFlow(): Flow<List<TimeEntry>> = listFlow
        override fun getRunningTimerFlow(): Flow<TimeEntry?> = runningFlow

        override suspend fun fetchRunningTimer(): Result<TimeEntry?> {
            return Result.success(runningFlow.value)
        }

        override suspend fun fetchTimeEntries(): Result<List<TimeEntry>> {
            return Result.success(listFlow.value)
        }

        override suspend fun startTimer(taskId: String): Result<TimeEntry> {
            val entry = TimeEntry("time1", taskId, "user1", System.currentTimeMillis(), null, null, System.currentTimeMillis())
            runningFlow.value = entry
            return Result.success(entry)
        }

        override suspend fun stopTimer(entryId: String): Result<TimeEntry> {
            val current = runningFlow.value ?: TimeEntry(entryId, "task1", "user1", System.currentTimeMillis(), null, null, System.currentTimeMillis())
            val stopped = current.copy(endTime = System.currentTimeMillis(), durationMinutes = 10)
            runningFlow.value = null
            listFlow.value = listFlow.value + stopped
            return Result.success(stopped)
        }
    }

    private class FakeAttendanceRepository : AttendanceRepository {
        private val listFlow = MutableStateFlow<List<Attendance>>(emptyList())
        private val activeFlow = MutableStateFlow<Attendance?>(null)

        override fun getAllAttendanceFlow(): Flow<List<Attendance>> = listFlow
        override fun getActiveAttendanceFlow(): Flow<Attendance?> = activeFlow

        override suspend fun fetchActiveAttendanceToday(): Result<Attendance?> {
            return Result.success(activeFlow.value)
        }

        override suspend fun fetchAttendanceHistory(): Result<List<Attendance>> {
            return Result.success(listFlow.value)
        }

        override suspend fun checkIn(): Result<Attendance> {
            val attendance = Attendance("att1", "user1", System.currentTimeMillis(), null, System.currentTimeMillis(), System.currentTimeMillis())
            activeFlow.value = attendance
            return Result.success(attendance)
        }

        override suspend fun checkOut(): Result<Attendance> {
            val current = activeFlow.value ?: Attendance("att1", "user1", System.currentTimeMillis(), null, System.currentTimeMillis(), System.currentTimeMillis())
            val checkOutRecord = current.copy(checkOut = System.currentTimeMillis(), updatedAt = System.currentTimeMillis())
            activeFlow.value = null
            listFlow.value = listFlow.value + checkOutRecord
            return Result.success(checkOutRecord)
        }
    }

    private class FakeDashboardService : com.example.businesserp.features.timer.data.remote.DashboardService {
        override suspend fun getSummary(): com.example.businesserp.core.network.ApiResponse<com.example.businesserp.features.timer.data.remote.DashboardSummaryDto> {
            return com.example.businesserp.core.network.ApiResponse(
                success = true,
                data = com.example.businesserp.features.timer.data.remote.DashboardSummaryDto(
                    totalProjects = 0,
                    activeProjects = 0,
                    totalTasks = 0,
                    completedTasks = 0,
                    teamMembers = 0,
                    totalMinutes = 0,
                    latestCommits = emptyList()
                )
            )
        }
    }

    private class FakeCommitDao : com.example.businesserp.features.timer.data.dao.CommitDao {
        private val commitsFlow = MutableStateFlow<List<com.example.businesserp.features.timer.data.entity.CommitEntity>>(emptyList())
        override fun getAllCommitsFlow(): Flow<List<com.example.businesserp.features.timer.data.entity.CommitEntity>> = commitsFlow
        override suspend fun insertAll(commits: List<com.example.businesserp.features.timer.data.entity.CommitEntity>) {
            commitsFlow.value = commits
        }
        override suspend fun deleteAll() {
            commitsFlow.value = emptyList()
        }
    }
}

package com.example.businesserp.core.database

import android.content.Context
import androidx.room.Room
import com.example.businesserp.features.projects.data.dao.ProjectDao
import com.example.businesserp.features.tasks.data.dao.TaskDao
import com.example.businesserp.features.timer.data.dao.TimeEntryDao
import com.example.businesserp.features.attendance.data.dao.AttendanceDao
import com.example.businesserp.features.notes.data.dao.NoteDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(
        @ApplicationContext context: Context
    ): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "erp_database"
        ).fallbackToDestructiveMigration() // Simple for development syncs
        .build()
    }

    @Provides
    fun provideProjectDao(database: AppDatabase): ProjectDao = database.projectDao()

    @Provides
    fun provideTaskDao(database: AppDatabase): TaskDao = database.taskDao()

    @Provides
    fun provideTimeEntryDao(database: AppDatabase): TimeEntryDao = database.timeEntryDao()

    @Provides
    fun provideAttendanceDao(database: AppDatabase): AttendanceDao = database.attendanceDao()

    @Provides
    fun provideNoteDao(database: AppDatabase): NoteDao = database.noteDao()

    @Provides
    fun provideCommitDao(database: AppDatabase): com.example.businesserp.features.timer.data.dao.CommitDao = database.commitDao()
}

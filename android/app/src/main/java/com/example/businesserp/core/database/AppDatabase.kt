package com.example.businesserp.core.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.example.businesserp.features.projects.data.entity.ProjectEntity
import com.example.businesserp.features.projects.data.dao.ProjectDao
import com.example.businesserp.features.tasks.data.entity.TaskEntity
import com.example.businesserp.features.tasks.data.dao.TaskDao
import com.example.businesserp.features.timer.data.entity.TimeEntryEntity
import com.example.businesserp.features.timer.data.dao.TimeEntryDao
import com.example.businesserp.features.attendance.data.entity.AttendanceEntity
import com.example.businesserp.features.attendance.data.dao.AttendanceDao
import com.example.businesserp.features.notes.data.entity.NoteEntity
import com.example.businesserp.features.notes.data.dao.NoteDao

import com.example.businesserp.features.timer.data.entity.CommitEntity
import com.example.businesserp.features.timer.data.dao.CommitDao

@Database(
    entities = [
        ProjectEntity::class,
        TaskEntity::class,
        TimeEntryEntity::class,
        AttendanceEntity::class,
        NoteEntity::class,
        CommitEntity::class
    ],
    version = 2,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun projectDao(): ProjectDao
    abstract fun taskDao(): TaskDao
    abstract fun timeEntryDao(): TimeEntryDao
    abstract fun attendanceDao(): AttendanceDao
    abstract fun noteDao(): NoteDao
    abstract fun commitDao(): CommitDao
}

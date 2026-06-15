package com.example.businesserp.features.projects.data.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "projects")
data class ProjectEntity(
    @PrimaryKey val id: String,
    val name: String,
    val description: String?,
    val status: String,
    val category: String,
    val startDate: Long?,
    val endDate: Long?,
    val createdBy: String,
    val githubRepo: String?,
    val createdAt: Long,
    val updatedAt: Long
)

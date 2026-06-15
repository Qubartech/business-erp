package com.example.businesserp.features.projects.domain.model

data class Project(
    val id: String,
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

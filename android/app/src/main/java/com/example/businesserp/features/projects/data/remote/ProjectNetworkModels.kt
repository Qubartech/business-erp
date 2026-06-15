package com.example.businesserp.features.projects.data.remote

import kotlinx.serialization.Serializable

@Serializable
data class ProjectDto(
    val id: String,
    val name: String,
    val description: String? = null,
    val status: String,
    val category: String,
    val startDate: String? = null,
    val endDate: String? = null,
    val createdBy: String,
    val githubRepo: String? = null,
    val createdAt: String,
    val updatedAt: String
)

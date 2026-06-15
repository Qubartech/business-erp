package com.example.businesserp.features.timer.domain.model

data class Commit(
    val sha: String,
    val projectId: String,
    val projectName: String,
    val message: String,
    val authorName: String,
    val authorEmail: String,
    val url: String?,
    val committedAt: Long
)

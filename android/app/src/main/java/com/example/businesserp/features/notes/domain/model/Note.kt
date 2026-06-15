package com.example.businesserp.features.notes.domain.model

data class Note(
    val id: String,
    val userId: String,
    val title: String,
    val content: String,
    val createdAt: Long,
    val updatedAt: Long
)

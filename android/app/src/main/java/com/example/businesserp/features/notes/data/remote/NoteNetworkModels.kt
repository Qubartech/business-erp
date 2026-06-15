package com.example.businesserp.features.notes.data.remote

import kotlinx.serialization.Serializable

@Serializable
data class NoteDto(
    val id: String,
    val userId: String,
    val title: String,
    val content: String,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class CreateNoteRequest(
    val title: String,
    val content: String
)

@Serializable
data class UpdateNoteRequest(
    val title: String? = null,
    val content: String? = null
)

package com.example.businesserp.features.notes.domain.repository

import com.example.businesserp.features.notes.domain.model.Note
import kotlinx.coroutines.flow.Flow

interface NoteRepository {
    fun getAllNotesFlow(): Flow<List<Note>>
    fun searchNotesFlow(query: String): Flow<List<Note>>
    suspend fun fetchNotes(): Result<List<Note>>
    suspend fun createNote(title: String, content: String): Result<Note>
    suspend fun updateNote(id: String, title: String, content: String): Result<Note>
    suspend fun deleteNote(id: String): Result<Unit>
}

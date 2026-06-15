package com.example.businesserp.features.notes.domain.usecase

import com.example.businesserp.features.notes.domain.model.Note
import com.example.businesserp.features.notes.domain.repository.NoteRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetNotesUseCase @Inject constructor(
    private val repository: NoteRepository
) {
    fun getNotesFlow(): Flow<List<Note>> = repository.getAllNotesFlow()

    fun searchNotesFlow(query: String): Flow<List<Note>> = repository.searchNotesFlow(query)

    suspend fun refreshNotes(): Result<List<Note>> = repository.fetchNotes()
}

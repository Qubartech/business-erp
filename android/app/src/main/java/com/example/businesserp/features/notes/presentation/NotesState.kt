package com.example.businesserp.features.notes.presentation

import com.example.businesserp.features.notes.domain.model.Note

data class NotesState(
    val notes: List<Note> = emptyList(),
    val searchQuery: String = "",
    val activeNoteId: String? = null,
    val activeTitle: String = "",
    val activeContent: String = "",
    val isEditing: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)

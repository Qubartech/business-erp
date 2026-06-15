package com.example.businesserp.features.notes.presentation

sealed interface NotesEvent {
    data object Refresh : NotesEvent
    data class SearchQueryChanged(val query: String) : NotesEvent
    data class SelectNoteForEditing(val noteId: String?, val title: String, val content: String) : NotesEvent
    data class TitleChanged(val title: String) : NotesEvent
    data class ContentChanged(val content: String) : NotesEvent
    data object SaveActiveNote : NotesEvent
    data class DeleteNote(val noteId: String) : NotesEvent
    data object CancelEditing : NotesEvent
    data object DismissError : NotesEvent
}

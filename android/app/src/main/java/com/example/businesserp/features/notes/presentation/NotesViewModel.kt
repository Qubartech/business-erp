package com.example.businesserp.features.notes.presentation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.businesserp.features.notes.domain.repository.NoteRepository
import com.example.businesserp.features.notes.domain.usecase.DeleteNoteUseCase
import com.example.businesserp.features.notes.domain.usecase.GetNotesUseCase
import com.example.businesserp.features.notes.domain.usecase.SaveNoteUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class NotesViewModel @Inject constructor(
    private val getNotesUseCase: GetNotesUseCase,
    private val saveNoteUseCase: SaveNoteUseCase,
    private val deleteNoteUseCase: DeleteNoteUseCase,
    private val noteRepository: NoteRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    private val _state = MutableStateFlow(NotesState())
    val state: StateFlow<NotesState> = _state.asStateFlow()

    init {
        observeNotesFlow()
        refreshSync()
    }

    private fun observeNotesFlow() {
        viewModelScope.launch {
            _searchQuery.flatMapLatest { query ->
                if (query.isBlank()) {
                    getNotesUseCase.getNotesFlow()
                } else {
                    getNotesUseCase.searchNotesFlow(query)
                }
            }.collect { notes ->
                _state.update { it.copy(notes = notes) }
            }
        }
    }

    fun onEvent(event: NotesEvent) {
        when (event) {
            is NotesEvent.Refresh -> refreshSync()
            is NotesEvent.SearchQueryChanged -> {
                _searchQuery.value = event.query
                _state.update { it.copy(searchQuery = event.query) }
            }
            is NotesEvent.TitleChanged -> _state.update { it.copy(activeTitle = event.title) }
            is NotesEvent.ContentChanged -> _state.update { it.copy(activeContent = event.content) }
            is NotesEvent.SelectNoteForEditing -> {
                _state.update {
                    it.copy(
                        activeNoteId = event.noteId,
                        activeTitle = event.title,
                        activeContent = event.content,
                        isEditing = true
                    )
                }
            }
            is NotesEvent.CancelEditing -> {
                _state.update {
                    it.copy(
                        activeNoteId = null,
                        activeTitle = "",
                        activeContent = "",
                        isEditing = false
                    )
                }
            }
            is NotesEvent.SaveActiveNote -> saveActiveNote()
            is NotesEvent.DeleteNote -> deleteNote(event.noteId)
            is NotesEvent.DismissError -> _state.update { it.copy(errorMessage = null) }
        }
    }

    private fun refreshSync() {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = getNotesUseCase.refreshNotes()
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message
                )
            }
        }
    }

    private fun saveActiveNote() {
        val currentState = _state.value
        val id = currentState.activeNoteId
        val title = currentState.activeTitle
        val content = currentState.activeContent

        if (title.isBlank()) {
            _state.update { it.copy(errorMessage = "Title cannot be empty") }
            return
        }

        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = saveNoteUseCase(id, title, content)
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message,
                    isEditing = if (result.isSuccess) false else state.isEditing,
                    activeNoteId = if (result.isSuccess) null else state.activeNoteId,
                    activeTitle = if (result.isSuccess) "" else state.activeTitle,
                    activeContent = if (result.isSuccess) "" else state.activeContent
                )
            }
            if (result.isSuccess) {
                noteRepository.fetchNotes() // Refresh sync
            }
        }
    }

    private fun deleteNote(noteId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, errorMessage = null) }
            val result = deleteNoteUseCase(noteId)
            _state.update { state ->
                state.copy(
                    isLoading = false,
                    errorMessage = result.exceptionOrNull()?.message
                )
            }
            if (result.isSuccess) {
                noteRepository.fetchNotes()
            }
        }
    }
}

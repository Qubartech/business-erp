package com.example.businesserp.features.notes.domain.usecase

import com.example.businesserp.features.notes.domain.model.Note
import com.example.businesserp.features.notes.domain.repository.NoteRepository
import javax.inject.Inject

class SaveNoteUseCase @Inject constructor(
    private val repository: NoteRepository
) {
    suspend operator fun invoke(id: String?, title: String, content: String): Result<Note> {
        if (title.isBlank()) return Result.failure(Exception("Note title cannot be empty"))
        return if (id == null) {
            repository.createNote(title, content)
        } else {
            repository.updateNote(id, title, content)
        }
    }
}

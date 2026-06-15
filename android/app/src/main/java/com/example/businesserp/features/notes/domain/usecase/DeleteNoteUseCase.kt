package com.example.businesserp.features.notes.domain.usecase

import com.example.businesserp.features.notes.domain.repository.NoteRepository
import javax.inject.Inject

class DeleteNoteUseCase @Inject constructor(
    private val repository: NoteRepository
) {
    suspend operator fun invoke(id: String): Result<Unit> = repository.deleteNote(id)
}

package com.example.businesserp.features.notes.data.repository

import com.example.businesserp.core.utils.DateUtils
import com.example.businesserp.features.notes.data.dao.NoteDao
import com.example.businesserp.features.notes.data.entity.NoteEntity
import com.example.businesserp.features.notes.data.remote.CreateNoteRequest
import com.example.businesserp.features.notes.data.remote.NoteDto
import com.example.businesserp.features.notes.data.remote.NoteService
import com.example.businesserp.features.notes.data.remote.UpdateNoteRequest
import com.example.businesserp.features.notes.domain.model.Note
import com.example.businesserp.features.notes.domain.repository.NoteRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NoteRepositoryImpl @Inject constructor(
    private val noteService: NoteService,
    private val noteDao: NoteDao
) : NoteRepository {

    override fun getAllNotesFlow(): Flow<List<Note>> {
        return noteDao.getAllNotesFlow().map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override fun searchNotesFlow(query: String): Flow<List<Note>> {
        return noteDao.searchNotesFlow(query).map { entities ->
            entities.map { it.toDomain() }
        }
    }

    override suspend fun fetchNotes(): Result<List<Note>> {
        return try {
            val response = noteService.list(emptyMap())
            if (response.success && response.data != null) {
                val dtos = response.data.items
                val entities = dtos.map { it.toEntity() }
                noteDao.deleteAll()
                noteDao.insertAll(entities)
                Result.success(entities.map { it.toDomain() })
            } else {
                Result.failure(Exception(response.message ?: "Failed to fetch notes"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun createNote(title: String, content: String): Result<Note> {
        return try {
            val response = noteService.create(CreateNoteRequest(title, content))
            if (response.success && response.data != null) {
                val dto = response.data
                val entity = dto.toEntity()
                noteDao.insert(entity)
                Result.success(entity.toDomain())
            } else {
                Result.failure(Exception(response.message ?: "Failed to create note"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateNote(id: String, title: String, content: String): Result<Note> {
        return try {
            val response = noteService.update(id, UpdateNoteRequest(title, content))
            if (response.success && response.data != null) {
                val dto = response.data
                val entity = dto.toEntity()
                noteDao.insert(entity)
                Result.success(entity.toDomain())
            } else {
                Result.failure(Exception(response.message ?: "Failed to update note"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteNote(id: String): Result<Unit> {
        return try {
            val response = noteService.delete(id)
            if (response.success) {
                noteDao.deleteById(id)
                Result.success(Unit)
            } else {
                Result.failure(Exception(response.message ?: "Failed to delete note"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun NoteDto.toEntity() = NoteEntity(
        id = id,
        userId = userId,
        title = title,
        content = content,
        createdAt = DateUtils.parseIsoToLong(createdAt) ?: System.currentTimeMillis(),
        updatedAt = DateUtils.parseIsoToLong(updatedAt) ?: System.currentTimeMillis()
    )

    private fun NoteEntity.toDomain() = Note(
        id = id,
        userId = userId,
        title = title,
        content = content,
        createdAt = createdAt,
        updatedAt = updatedAt
    )
}

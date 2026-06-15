package com.example.businesserp.features.notes.data.remote

import com.example.businesserp.core.network.ApiResponse
import retrofit2.http.*

interface NoteService {
    @GET("notes")
    suspend fun list(@QueryMap query: Map<String, String>): ApiResponse<com.example.businesserp.core.network.PaginatedList<NoteDto>>

    @POST("notes")
    suspend fun create(@Body request: CreateNoteRequest): ApiResponse<NoteDto>

    @PATCH("notes/{id}")
    suspend fun update(
        @Path("id") id: String,
        @Body request: UpdateNoteRequest
    ): ApiResponse<NoteDto>

    @DELETE("notes/{id}")
    suspend fun delete(@Path("id") id: String): ApiResponse<Unit?>
}

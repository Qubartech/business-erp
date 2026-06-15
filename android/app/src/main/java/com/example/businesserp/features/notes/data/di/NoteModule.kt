package com.example.businesserp.features.notes.data.di

import com.example.businesserp.features.notes.data.remote.NoteService
import com.example.businesserp.features.notes.data.repository.NoteRepositoryImpl
import com.example.businesserp.features.notes.domain.repository.NoteRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class NoteModule {

    @Binds
    @Singleton
    abstract fun bindNoteRepository(
        noteRepositoryImpl: NoteRepositoryImpl
    ): NoteRepository

    companion object {
        @Provides
        @Singleton
        fun provideNoteService(retrofit: Retrofit): NoteService {
            return retrofit.create(NoteService::class.java)
        }
    }
}

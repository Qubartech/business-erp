package com.example.businesserp.features.projects.data.di

import com.example.businesserp.features.projects.data.remote.ProjectService
import com.example.businesserp.features.projects.data.repository.ProjectRepositoryImpl
import com.example.businesserp.features.projects.domain.repository.ProjectRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class ProjectModule {

    @Binds
    @Singleton
    abstract fun bindProjectRepository(
        projectRepositoryImpl: ProjectRepositoryImpl
    ): ProjectRepository

    companion object {
        @Provides
        @Singleton
        fun provideProjectService(retrofit: Retrofit): ProjectService {
            return retrofit.create(ProjectService::class.java)
        }
    }
}

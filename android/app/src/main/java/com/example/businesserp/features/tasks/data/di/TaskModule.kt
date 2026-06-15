package com.example.businesserp.features.tasks.data.di

import com.example.businesserp.features.tasks.data.remote.TaskService
import com.example.businesserp.features.tasks.data.repository.TaskRepositoryImpl
import com.example.businesserp.features.tasks.domain.repository.TaskRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class TaskModule {

    @Binds
    @Singleton
    abstract fun bindTaskRepository(
        taskRepositoryImpl: TaskRepositoryImpl
    ): TaskRepository

    companion object {
        @Provides
        @Singleton
        fun provideTaskService(retrofit: Retrofit): TaskService {
            return retrofit.create(TaskService::class.java)
        }
    }
}

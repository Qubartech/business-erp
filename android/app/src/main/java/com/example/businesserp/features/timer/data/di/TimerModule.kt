package com.example.businesserp.features.timer.data.di

import com.example.businesserp.features.timer.data.remote.TimeEntryService
import com.example.businesserp.features.timer.data.repository.TimeEntryRepositoryImpl
import com.example.businesserp.features.timer.domain.repository.TimeEntryRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class TimerModule {

    @Binds
    @Singleton
    abstract fun bindTimeEntryRepository(
        timeEntryRepositoryImpl: TimeEntryRepositoryImpl
    ): TimeEntryRepository

    companion object {
        @Provides
        @Singleton
        fun provideTimeEntryService(retrofit: Retrofit): TimeEntryService {
            return retrofit.create(TimeEntryService::class.java)
        }

        @Provides
        @Singleton
        fun provideDashboardService(retrofit: Retrofit): com.example.businesserp.features.timer.data.remote.DashboardService {
            return retrofit.create(com.example.businesserp.features.timer.data.remote.DashboardService::class.java)
        }
    }
}

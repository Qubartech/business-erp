package com.example.businesserp.features.attendance.data.di

import com.example.businesserp.features.attendance.data.remote.AttendanceService
import com.example.businesserp.features.attendance.data.repository.AttendanceRepositoryImpl
import com.example.businesserp.features.attendance.domain.repository.AttendanceRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class AttendanceModule {

    @Binds
    @Singleton
    abstract fun bindAttendanceRepository(
        attendanceRepositoryImpl: AttendanceRepositoryImpl
    ): AttendanceRepository

    companion object {
        @Provides
        @Singleton
        fun provideAttendanceService(retrofit: Retrofit): AttendanceService {
            return retrofit.create(AttendanceService::class.java)
        }
    }
}

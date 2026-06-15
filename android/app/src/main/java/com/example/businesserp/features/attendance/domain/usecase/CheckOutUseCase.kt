package com.example.businesserp.features.attendance.domain.usecase

import com.example.businesserp.features.attendance.domain.model.Attendance
import com.example.businesserp.features.attendance.domain.repository.AttendanceRepository
import javax.inject.Inject

class CheckOutUseCase @Inject constructor(
    private val repository: AttendanceRepository
) {
    suspend operator fun invoke(): Result<Attendance> {
        return repository.checkOut()
    }
}

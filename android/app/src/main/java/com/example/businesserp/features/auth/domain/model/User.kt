package com.example.businesserp.features.auth.domain.model

data class User(
    val id: String,
    val name: String,
    val email: String,
    val role: String
)

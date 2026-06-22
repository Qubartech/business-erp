"use client";

import UserFormPage from "@/views/users/UserFormPage";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <UserFormPage />
    </ProtectedRoute>
  );
}

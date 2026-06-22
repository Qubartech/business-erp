"use client";

import UsersListPage from "@/views/users/UsersListPage";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute roles={["admin"]}>
      <UsersListPage />
    </ProtectedRoute>
  );
}

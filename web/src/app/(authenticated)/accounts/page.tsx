"use client";

import AccountsDashboard from "@/views/accounts/AccountsDashboard";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute roles={["admin", "account"]}>
      <AccountsDashboard />
    </ProtectedRoute>
  );
}

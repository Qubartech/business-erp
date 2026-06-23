"use client";

import AccountReports from "@/views/accounts/AccountReports";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute roles={["admin", "account"]}>
      <AccountReports />
    </ProtectedRoute>
  );
}

"use client";

import TransactionsList from "@/views/accounts/TransactionsList";
import { ProtectedRoute } from "@/features/auth/ProtectedRoute";

export default function Page() {
  return (
    <ProtectedRoute roles={["admin", "account"]}>
      <TransactionsList />
    </ProtectedRoute>
  );
}

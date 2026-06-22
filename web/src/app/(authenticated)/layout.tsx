"use client";

import { ProtectedRoute } from "@/features/auth/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import React from "react";

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

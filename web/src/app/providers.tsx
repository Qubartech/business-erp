"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ThemeProvider } from "@/features/theme/ThemeContext";
import { TimeTrackerProvider } from "@/features/time/TimeTrackerContext";
import React from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TimeTrackerProvider>
            {children}
            <Toaster richColors position="top-right" />
          </TimeTrackerProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

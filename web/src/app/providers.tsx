"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { queryClient } from "@/lib/queryClient";
import { AuthProvider } from "@/features/auth/AuthProvider";
import { ThemeProvider, useTheme } from "@/features/theme/ThemeContext";
import { TimeTrackerProvider } from "@/features/time/TimeTrackerContext";
import React from "react";

function ToastWrapper() {
  const { theme } = useTheme();
  return (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar
      newestOnTop
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme={theme === "light" ? "light" : "dark"}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TimeTrackerProvider>
            {children}
            <ToastWrapper />
          </TimeTrackerProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

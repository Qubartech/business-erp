"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import type { Role } from "@/types";
import { LoadingPage } from "@/components/Loading";

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      } else if (roles && !roles.includes(user.role)) {
        router.replace("/");
      }
    }
  }, [user, loading, roles, pathname, router]);

  if (loading) {
    return <LoadingPage message="Verifying Session..." fullScreen />;
  }

  if (!user || (roles && !roles.includes(user.role))) {
    return <LoadingPage message="Redirecting..." fullScreen />;
  }

  return <>{children}</>;
}

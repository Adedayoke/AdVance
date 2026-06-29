"use client";

/**
 * components/layout/RouteGuard.tsx
 *
 * Wraps any page that requires authentication and/or a specific role.
 * Shows a full-screen loader while session is rehydrating.
 * Redirects to /login if unauthenticated.
 * Redirects to the correct dashboard if authenticated but wrong role.
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types";

interface RouteGuardProps {
  children: React.ReactNode;
  allowedRole: UserRole;
}

const roleDashboards: Record<UserRole, string> = {
  admin: "/dashboard/admin",
  staff: "/dashboard/staff",
  client: "/dashboard/client",
};

export default function RouteGuard({ children, allowedRole }: RouteGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== allowedRole) {
      // Authenticated but wrong role — send to their actual dashboard
      router.replace(roleDashboards[user.role]);
    }
  }, [user, isLoading, allowedRole, router]);

  if (isLoading) {
    return <FullScreenLoader />;
  }

  if (!user || user.role !== allowedRole) {
    // Render nothing while redirect is in flight
    return null;
  }

  return <>{children}</>;
}

function FullScreenLoader() {
  return (
    <div className="advance-loader">
      <div className="advance-loader__spinner" />
    </div>
  );
}
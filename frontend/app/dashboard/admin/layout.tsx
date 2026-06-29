import RouteGuard from "@/components/layout/RouteGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="admin">
      <DashboardShell>{children}</DashboardShell>
    </RouteGuard>
  );
}
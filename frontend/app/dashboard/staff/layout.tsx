import RouteGuard from "@/components/layout/RouteGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Staff Dashboard" };

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="staff">
      <DashboardShell>{children}</DashboardShell>
    </RouteGuard>
  );
}
import RouteGuard from "@/components/layout/RouteGuard";
import DashboardShell from "@/components/dashboard/DashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Client Dashboard" };

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RouteGuard allowedRole="client">
      <DashboardShell>{children}</DashboardShell>
    </RouteGuard>
  );
}
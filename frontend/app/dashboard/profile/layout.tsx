import DashboardShell from "@/components/dashboard/DashboardShell";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
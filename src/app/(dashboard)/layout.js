import AppShell from "@/components/AppShell";
import { ToastProvider } from "@/components/Toast";
import { RoleProvider } from "@/components/Role";

export default function DashboardLayout({ children }) {
  return (
    <RoleProvider>
      <ToastProvider>
        <AppShell>{children}</AppShell>
      </ToastProvider>
    </RoleProvider>
  );
}

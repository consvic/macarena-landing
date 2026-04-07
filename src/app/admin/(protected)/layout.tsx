import type React from "react";
import { AdminLayoutShell } from "@/components/admin/AdminLayoutShell";

export const dynamic = "force-dynamic";

export default function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}

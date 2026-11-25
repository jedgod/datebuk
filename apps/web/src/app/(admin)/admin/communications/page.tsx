"use client";

import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { CommunicationsConsole } from "@/components/communications/CommunicationsConsole";

export default function AdminCommunicationsPage() {
  return (
    <DashboardLayout>
      <CommunicationsConsole mode="admin" />
    </DashboardLayout>
  );
}

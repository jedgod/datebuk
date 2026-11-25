"use client";

import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { CommunicationsConsole } from "@/components/communications/CommunicationsConsole";

export default function AdminCommunicationsPage() {
  return (
    <DashboardLayout>
      {/* Cancels DashboardLayout's 24px top padding so the console sits directly under the header bar. */}
      <div className="-mt-4 md:-mt-6">
        <CommunicationsConsole mode="admin" />
      </div>
    </DashboardLayout>
  );
}

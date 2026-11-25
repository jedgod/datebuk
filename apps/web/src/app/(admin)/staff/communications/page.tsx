"use client";

import { CommunicationsConsole } from "@/components/communications/CommunicationsConsole";

export default function StaffCommunicationsPage() {
  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <CommunicationsConsole mode="staff" />
    </div>
  );
}

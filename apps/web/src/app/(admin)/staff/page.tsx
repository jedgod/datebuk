// app/(admin)/staff/page.tsx
import { StaffDashboard } from "@/components/staff/StaffDashboard";

export const metadata = {
  title: "My Queue - Staff Dashboard",
  description: "Agent workspace for handling tickets and live support",
};

export default function StaffPage() {
  return <StaffDashboard />;
}

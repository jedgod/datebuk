import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { PackOperationsOverview } from "@/components/packs/PackOperationsOverview";

export default function AdminPackOperationsPage() {
  return (
    <DashboardLayout>
      <PackOperationsOverview audience="Admin" detailBase="/admin/dashboard/packs" />
    </DashboardLayout>
  );
}

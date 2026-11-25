import type { Metadata } from "next";
import { AppSidebar } from "@/components/staff/AppSidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export const revalidate = 0;

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/datebuk_Staff.png", sizes: "any", type: "image/png" },
    ],
  },
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true} className="bg-slate-50">
      <AppSidebar />
      <SidebarInset className="bg-slate-50 overflow-x-hidden">
        {/* Mobile trigger */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 lg:hidden">
          <SidebarTrigger />
        </header>

        {/* Main content */}
        <div className="flex flex-1 min-w-0 flex-col bg-slate-50">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

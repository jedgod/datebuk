"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import {
  BarChart2,
  LayoutList,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Ticket,
  Users,
  Circle,
  ArrowRight,
  Activity,
  Send,
  AlertTriangle,
  Boxes,
  HeartHandshake,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { performLogout } from "@/lib/logout";
import { filterStaffSafeNavItems } from "@/lib/staff/navigation-guard";

// Menu items with icons matching staff dashboard
const navMain = [
  {
    title: "My Queue",
    url: "/staff",
    icon: LayoutDashboard,
  },
  {
    title: "All Tickets",
    url: "/staff/tickets",
    icon: Ticket,
  },
  {
    title: "Users Search",
    url: "/staff/users",
    icon: Search,
  },
  {
    title: "Live Chats",
    url: "/staff/chats",
    icon: MessageSquare,
  },
  {
    title: "Reports",
    url: "/staff/reports",
    icon: BarChart2,
  },
  {
    title: "Pack Operations",
    url: "/staff/packs",
    icon: Boxes,
  },
  {
    title: "Concierge Queue",
    url: "/staff/concierge",
    icon: HeartHandshake,
  },
];

const navVideoMonitor = [
  {
    title: "Moderation Dashboard",
    url: "/staff/video-monitor/dashboard",
    icon: Activity,
  },
  {
    title: "Push Control",
    url: "/staff/video-monitor/push",
    icon: Send,
  },
  {
    title: "Session Monitor",
    url: "/staff/video-monitor/sessions",
    icon: Activity,
  },
  {
    title: "Quarantine Review",
    url: "/staff/video-monitor/quarantine",
    icon: AlertTriangle,
  },
  {
    title: "Video Date Controls",
    url: "/staff/video-monitor/dashboard",
    icon: Settings,
  },
  {
    title: "Role Access",
    url: "/staff/roles",
    icon: LayoutList,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() || "";
  const router = useRouter();
  
  // Staff profile state
  const [staffProfile, setStaffProfile] = useState({
    name: "Anthony Tony",
    staffId: "STF-ENG-SUP-05148",
    image: "/datebuk_Staff.png",
    status: "active" as "active" | "idle" | "busy",
    loginTime: new Date(),
  });
  
  const [elapsedTime, setElapsedTime] = useState("00:00:00");
  const [loading, setLoading] = useState(true);

  const safeNavMain = filterStaffSafeNavItems(navMain);
  const safeNavVideoMonitor = filterStaffSafeNavItems(navVideoMonitor);
  const isSettingsActive = pathname === "/staff/settings" || pathname.startsWith("/staff/settings/");

  // Load staff profile from localStorage or API
  useEffect(() => {
    const loadStaffProfile = async () => {
      try {
        // Check if staff data exists in localStorage (set during login)
        const savedProfile = localStorage.getItem("staffProfile");
        if (savedProfile) {
          const parsedProfile = JSON.parse(savedProfile);
          setStaffProfile(prev => ({
            ...prev,
            name: parsedProfile.name || prev.name,
            staffId: parsedProfile.staffId || prev.staffId,
            image: parsedProfile.image || prev.image,
            status: parsedProfile.status || "active",
            loginTime: new Date(parsedProfile.loginTime || new Date()),
          }));
        }
      } catch (error) {
        console.log("Loading profile from storage failed, using defaults");
      } finally {
        setLoading(false);
      }
    };

    loadStaffProfile();
  }, []);

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const loginTime = new Date(staffProfile.loginTime);
      const diff = Math.floor((now.getTime() - loginTime.getTime()) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      setElapsedTime(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [staffProfile.loginTime]);

  // Status color mapping
  const statusConfig = {
    active: { color: "bg-green-500", label: "ACTIVE", textColor: "text-green-600" },
    idle: { color: "bg-pink-500", label: "IDLE", textColor: "text-pink-600" },
    busy: { color: "bg-red-500", label: "BUSY", textColor: "text-red-600" },
  };

  const currentStatus = statusConfig[staffProfile.status];

  const handleLogout = () => {
    // Clear staff profile on logout
    localStorage.removeItem("staffProfile");
    
    performLogout({
      logout: () => {},
      router,
      redirectTo: "/staff-login",
      toastMessage: "Staff logged out successfully",
    });
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 dark:border-slate-700 flex flex-col" {...props}>
      <SidebarContent className="flex flex-col h-full">
        {/* Header / Branding */}
        <div className="px-4 py-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Support Workspace</h2>
        </div>

        {/* Main Navigation with Separators */}
        <SidebarGroup className="flex-1 px-0">
          <SidebarGroupContent className="px-0">
            <SidebarMenu>
              {safeNavMain.map((item, index) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");

                return (
                  <div key={item.title}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                        className={`px-4 py-3 rounded-none transition-colors border-l-2 ${
                          isActive
                            ? "border-blue-500 bg-blue-50 text-blue-800 font-semibold dark:bg-blue-900/30 dark:text-blue-200"
                            : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <Link href={item.url}>
                          <item.icon className="w-5 h-5" />
                          <span className="text-base font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    {/* Separator line after each item */}
                    <div className="h-px bg-slate-200 dark:bg-slate-700 mx-4"></div>
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="px-0 pb-3">
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-slate-500">
            Video Monitor
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-0">
            <SidebarMenu>
              {safeNavVideoMonitor.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/");
                return (
                  <div key={item.title}>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={isActive}
                        className={`px-4 py-3 rounded-none transition-colors border-l-2 ${
                          isActive
                            ? "border-blue-500 bg-blue-50 text-blue-800 font-semibold dark:bg-blue-900/30 dark:text-blue-200"
                            : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        }`}
                      >
                        <Link href={item.url}>
                          <item.icon className="w-5 h-5" />
                          <span className="text-base font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <div className="h-px bg-slate-200 dark:bg-slate-700 mx-4"></div>
                  </div>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <div className="border-t border-slate-200 dark:border-slate-700 px-0">
          <SidebarGroup className="py-3">
            <SidebarGroupContent className="px-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip="Settings"
                    isActive={isSettingsActive}
                    className={`px-4 py-3 rounded-none transition-colors border-l-2 ${
                      isSettingsActive
                        ? "border-blue-500 bg-blue-50 text-blue-800 font-semibold dark:bg-blue-900/30 dark:text-blue-200"
                        : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    }`}
                  >
                    <Link href="/staff/settings">
                      <Settings className="w-5 h-5" />
                      <span className="text-base font-medium">Settings</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>

        {/* Profile Section - At Bottom */}
        <div className="border-t-2 border-slate-900 dark:border-slate-200 bg-white dark:bg-slate-800">
          {/* Status Badge */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wider">
                STAFF LOGGED IN
              </span>
              <div className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full ${currentStatus.color}`}></div>
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {currentStatus.label}
                </span>
              </div>
            </div>
          </div>

          {/* Staff Image */}
          <div className="flex justify-center py-3">
            <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-slate-300 dark:border-slate-600 shadow-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0">
              <Image
                src={staffProfile.image}
                alt={staffProfile.name}
                width={96}
                height={96}
                className="w-full h-full object-cover"
                priority
              />
            </div>
          </div>

          {/* Staff Info */}
          <div className="px-4 space-y-2 pb-4">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                NAME: {staffProfile.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white tracking-wide font-mono">
                STAFF ID: {staffProfile.staffId}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">
                TIME: <span className="text-amber-600 dark:text-amber-400 font-mono">{elapsedTime}</span>
              </p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full mx-0 px-4 py-3 bg-slate-900 dark:bg-slate-950 text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-slate-900 transition-colors rounded-none"
          >
            <ArrowRight className="w-5 h-5" />
            Logout
          </button>
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

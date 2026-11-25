"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Bell,
  Calendar,
  Camera,
  Crown,
  Gift,
  Heart,
  HeartHandshake,
  HelpCircle,
  Home,
  Lock,
  LogOut,
  MapPin,
  MessageCircle,
  Mic,
  ChevronDown,
  ChevronRight,
  Settings,
  Shield,
  Sparkles,
  Star,
  User,
  Users,
  Video,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export type EnterpriseSidebarItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

export type EnterpriseSidebarSection = {
  title: string;
  icon: string;
  items: EnterpriseSidebarItem[];
};

interface EnterpriseSidebarProps {
  user?: {
    name?: string;
    avatar?: string;
  };
}

export const enterpriseSections: EnterpriseSidebarSection[] = [
  {
    title: "DASHBOARD",
    icon: "🏠",
    items: [
      { label: "Home", href: "/dashboard", icon: <Home size={16} /> },
      { label: "Activity Feed", href: "/dashboard/advanced/activity-feed", icon: <Sparkles size={16} /> },
      { label: "Explore", href: "/dashboard/explore", icon: <MapPin size={16} /> },
      { label: "Matches", href: "/dashboard/matches", icon: <Heart size={16} /> },
    ],
  },
  {
    title: "CONNECTIONS",
    icon: "❤️",
    items: [
      { label: "Likes Received", href: "/dashboard/advanced/likes-received", icon: <Heart size={16} /> },
      { label: "Likes Sent", href: "/dashboard/advanced/likes-sent", icon: <Heart size={16} /> },
      { label: "Favorites", href: "/dashboard/advanced/favorites", icon: <Star size={16} /> },
      { label: "Profile Visitors", href: "/dashboard/advanced/profile-visitors", icon: <Users size={16} /> },
    ],
  },
  {
    title: "COMMUNICATION",
    icon: "💬",
    items: [
      { label: "Messages", href: "/dashboard/messages", icon: <MessageCircle size={16} /> },
      { label: "Voice Connect", href: "/dashboard/advanced/voice-connect", icon: <Mic size={16} /> },
      { label: "Video Chat", href: "/dashboard/advanced/video-chat", icon: <Video size={16} /> },
      { label: "Date Requests", href: "/dashboard/advanced/date-requests", icon: <Calendar size={16} /> },
    ],
  },
  {
    title: "DISCOVERY",
    icon: "🔍",
    items: [
      { label: "Nearby Singles", href: "/dashboard/advanced/nearby-singles", icon: <MapPin size={16} /> },
      { label: "Smart Match AI", href: "/dashboard/advanced/smart-match-ai", icon: <Sparkles size={16} /> },
      { label: "Events & Meetups", href: "/dashboard/advanced/events-meetups", icon: <Users size={16} /> },
    ],
  },
  {
    title: "PROFILE",
    icon: "👤",
    items: [
      { label: "My Profile", href: "/dashboard/profile", icon: <User size={16} /> },
      { label: "Verification Center", href: "/dashboard/advanced/verification-center", icon: <Shield size={16} /> },
      { label: "Profile Analytics", href: "/dashboard/advanced/profile-analytics", icon: <Sparkles size={16} /> },
    ],
  },
  {
    title: "DATING TOOLS",
    icon: "📅",
    items: [
      { label: "Date Planner", href: "/dashboard/advanced/date-planner", icon: <Calendar size={16} /> },
      { label: "Availability Calendar", href: "/dashboard/advanced/availability-calendar", icon: <Calendar size={16} /> },
    ],
  },
  {
    title: "PREMIUM",
    icon: "⭐",
    items: [
      { label: "Subscription", href: "/dashboard/subscription", icon: <Crown size={16} /> },
      { label: "Concierge", href: "/dashboard/concierge", icon: <HeartHandshake size={16} /> },
      { label: "Boost Profile", href: "/dashboard/advanced/boost-profile", icon: <Sparkles size={16} /> },
      { label: "Spotlight", href: "/dashboard/advanced/spotlight", icon: <Star size={16} /> },
    ],
  },
  {
    title: "SAFETY",
    icon: "🛡️",
    items: [
      { label: "Photo Verification", href: "/dashboard/advanced/identity-verification", icon: <Shield size={16} /> },
      { label: "Report & Block", href: "/dashboard/advanced/report-block", icon: <Lock size={16} /> },
      { label: "Privacy Controls", href: "/dashboard/advanced/privacy-controls", icon: <Lock size={16} /> },
    ],
  },
  {
    title: "REWARDS",
    icon: "🎁",
    items: [
      { label: "Referrals", href: "/dashboard/advanced/referrals", icon: <Gift size={16} /> },
      { label: "Daily Check-In", href: "/dashboard/advanced/daily-check-in", icon: <Calendar size={16} /> },
      { label: "Badges", href: "/dashboard/advanced/badges", icon: <Camera size={16} /> },
    ],
  },
  {
    title: "SYSTEM",
    icon: "⚙️",
    items: [
      { label: "Notifications", href: "/dashboard/notifications", icon: <Bell size={16} /> },
      { label: "Settings", href: "/dashboard/settings", icon: <Settings size={16} /> },
      { label: "Help & Support", href: "/help", icon: <HelpCircle size={16} /> },
    ],
  },
];

export function EnterpriseSidebar({ user }: EnterpriseSidebarProps) {
  const pathname = usePathname();
  const safePathname = pathname ?? "";
  const currentUser = useCurrentUser();
  // Pages pass a placeholder ({ name: "You" }) when they have no user of their own;
  // prefer the real signed-in user over that placeholder.
  const passedName = user?.name?.trim();
  const hasRealName = !!passedName && passedName !== "You";
  const userName = (hasRealName ? passedName : currentUser?.name) || passedName || "You";
  const userAvatar = user?.avatar || currentUser?.avatar;
  const defaultOpen = useMemo(() => {
    const openTitles = new Set<string>(["DASHBOARD", "SYSTEM"]);
    enterpriseSections.forEach((section) => {
      if (section.items.some((item) => safePathname === item.href || safePathname.startsWith(`${item.href}/`))) {
        openTitles.add(section.title);
      }
    });
    return openTitles;
  }, [safePathname]);

  const [openSections, setOpenSections] = useState<Set<string>>(defaultOpen);

  useEffect(() => {
    setOpenSections(defaultOpen);
  }, [defaultOpen]);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }
      return next;
    });
  };

  return (
    <aside className="hidden w-72 flex-col border-r border-pink-200 bg-white/85 backdrop-blur-xl lg:flex">
      <div className="p-5 border-b border-pink-200 flex items-center gap-3">
        <Avatar className="h-11 w-11 ring-2 ring-pink-500/40">
          <AvatarImage src={userAvatar} alt={userName} />
          <AvatarFallback>{userName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-gray-900">{userName}</p>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" /> Online
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {enterpriseSections.map((section) => (
          <section key={section.title}>
            <button
              type="button"
              title={`Toggle ${section.title.toLowerCase()} section`}
              onClick={() => toggleSection(section.title)}
              className="mb-2 w-full px-2 py-1.5 text-[10px] font-bold tracking-widest text-gray-500 uppercase flex items-center justify-between rounded hover:bg-pink-50"
            >
              <span className="flex items-center gap-2">
                <span>{section.icon}</span>
                <span>{section.title}</span>
              </span>
              {openSections.has(section.title) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>

            {openSections.has(section.title) ? <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = item.href
                  ? safePathname === item.href || safePathname.startsWith(`${item.href}/`)
                  : false;

                return (
                  <Link
                    key={`${section.title}-${item.label}`}
                    href={item.href}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "bg-gradient-to-r from-pink-200 to-purple-200 text-gray-900"
                        : "text-gray-700 hover:bg-pink-50"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div> : null}
          </section>
        ))}
      </div>

      <div className="p-3 border-t border-pink-200">
        <Link
          href="/logout"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </Link>
      </div>
    </aside>
  );
}

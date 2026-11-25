"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Menu, 
  X, 
  BarChart3, 
  Globe, 
  Shield, 
  AlertTriangle, 
  Users, 
  FlaskConical,
  LogOut,
  MessageSquare,
  UserCog,
  Search,
  StickyNote,
  Activity,
  Send,
  ShieldAlert,
  Settings,
  Boxes
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores/auth';
import { performLogout } from '@/lib/logout';

interface MobileNavProps {
  onNavigate?: () => void;
}

export function MobileNav({ onNavigate }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard', icon: BarChart3 },
    { label: 'Pack Operations', href: '/admin/dashboard/packs', icon: Boxes },
    { label: 'IP Monitoring', href: '/admin/ip-monitoring', icon: Globe },
    { label: 'Risk Scores', href: '/admin/risk-scores', icon: Shield },
    { label: 'Fraud Events', href: '/admin/fraud-events', icon: AlertTriangle },
    { label: 'Moderator Queue', href: '/admin/moderator-queue', icon: Users },
    { label: 'Support Tickets', href: '/admin/support-tickets', icon: MessageSquare },
    { label: 'Live Support', href: '/admin/live-support', icon: MessageSquare },
    { label: 'User Lookup', href: '/admin/user-lookup', icon: Search },
    { label: 'Staff', href: '/admin/staff/overview', icon: UserCog },
    { label: 'Staff Notes', href: '/admin/staff-notes', icon: StickyNote },
    { label: 'Experiments', href: '/admin/experiments', icon: FlaskConical },
  ];

  const videoMonitorItems = [
    { label: 'Admin Push', href: '/admin/push', icon: Send },
    { label: 'Admin Sessions', href: '/admin/sessions', icon: Activity },
    { label: 'Admin Quarantine', href: '/admin/quarantine', icon: ShieldAlert },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleNavigate = () => {
    setIsOpen(false);
    onNavigate?.();
  };

  const handleLogout = () => {
    performLogout({
      logout,
      router,
      redirectTo: '/admin/login',
      toastMessage: 'Admin logged out',
      onAfterLogout: () => {
        setIsOpen(false);
        onNavigate?.();
      },
    });
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between md:hidden shadow-lg">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
        <h1 className="font-bold text-base text-white tracking-wide">Datebuk Admin</h1>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative text-slate-300 hover:text-white hover:bg-slate-700"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </Button>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-slate-900 border-b border-slate-700 px-4 py-2 space-y-1 shadow-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavigate}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  'hover:bg-slate-700',
                  pathname === item.href 
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30' 
                    : 'text-slate-300'
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Video Monitor
          </div>
          {videoMonitorItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavigate}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  'hover:bg-slate-700',
                  pathname === item.href 
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30' 
                    : 'text-slate-300'
                )}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <hr className="my-2 border-slate-700" />
          <Button
            variant="ghost"
            className="w-full justify-start text-red-400 hover:bg-red-900/30 hover:text-red-300 text-sm"
            onClick={handleLogout}
          >
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>
      )}
    </header>
  );
}

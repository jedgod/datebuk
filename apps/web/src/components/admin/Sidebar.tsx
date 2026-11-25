"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BarChart3, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Shield,
  AlertTriangle,
  Users,
  Globe,
  FlaskConical,
  MessageSquare,
  UserCog,
  Search,
  StickyNote,
  UserPlus,
  Activity,
  Send,
  ShieldAlert,
  Settings,
  Lock,
  Code2,
  CreditCard,
  Boxes,
  HeartHandshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores/auth';
import { performLogout } from '@/lib/logout';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    performLogout({
      logout,
      router,
      redirectTo: '/admin/login',
      toastMessage: 'Admin logged out',
    });
  };

  const navItems = [
    {
      label: 'Overview',
      href: '/admin/dashboard',
      icon: BarChart3,
      description: 'Security dashboard'
    },
    {
      label: 'Pack Operations',
      href: '/admin/dashboard/packs',
      icon: Boxes,
      description: 'Internal module controls'
    },
    {
      label: 'IP Monitoring',
      href: '/admin/ip-monitoring',
      icon: Globe,
      description: 'IP tracking & VPN detection'
    },
    {
      label: 'Admin Regions',
      href: '/admin/regions',
      icon: Globe,
      description: 'Regional visibility rules'
    },
    {
      label: 'Risk Scores',
      href: '/admin/risk-scores',
      icon: Shield,
      description: 'User risk analysis'
    },
    {
      label: 'Fraud Events',
      href: '/admin/fraud-events',
      icon: AlertTriangle,
      description: 'Fraud event management'
    },
    {
      label: 'Moderator Queue',
      href: '/admin/moderator-queue',
      icon: Users,
      description: 'Review queue'
    },
    {
      label: 'Support Tickets',
      href: '/admin/support-tickets',
      icon: MessageSquare,
      description: 'Customer support'
    },
    {
      label: 'Live Support',
      href: '/admin/live-support',
      icon: MessageSquare,
      description: 'Real-time chat'
    },
    {
      label: 'User Lookup',
      href: '/admin/user-lookup',
      icon: Search,
      description: 'Find users'
    },
    {
      label: 'Staff',
      href: '/admin/staff/overview',
      icon: UserCog,
      description: 'Team management'
    },
    {
      label: 'Staff Notes',
      href: '/admin/staff-notes',
      icon: StickyNote,
      description: 'Internal notes'
    },
    {
      label: 'Roles & RBAC',
      href: '/admin/rbac',
      icon: Lock,
      description: 'Access control'
    },
    {
      label: 'Icon Standards',
      href: '/admin/icon-standardization',
      icon: Code2,
      description: 'UI consistency guide'
    },
    {
      label: 'Experiments',
      href: '/admin/experiments',
      icon: FlaskConical,
      description: 'A/B testing'
    },
    {
      label: 'Subscription Features',
      href: '/admin/subscription-features',
      icon: CreditCard,
      description: 'Plan entitlements'
    },
    {
      label: 'Communications Center',
      href: '/admin/communications',
      icon: MessageSquare,
      description: 'Twilio SMS, senders & delivery'
    },
    {
      label: 'Concierge Operations',
      href: '/admin/concierge',
      icon: HeartHandshake,
      description: 'Consent-first service oversight'
    },
  ];

  const videoMonitorItems = [
    {
      label: 'Admin Push',
      href: '/admin/push',
      icon: Send,
      description: 'Broadcast alerts'
    },
    {
      label: 'Admin Sessions',
      href: '/admin/sessions',
      icon: Activity,
      description: 'Live session oversight'
    },
    {
      label: 'Admin Quarantine',
      href: '/admin/quarantine',
      icon: ShieldAlert,
      description: 'Review quarantined assets'
    },
    {
      label: 'Video Date Controls',
      href: '/admin/video-date/settings',
      icon: Settings,
      description: 'Feature policies & rules'
    },
  ];

  return (
    <aside className={cn(
      'fixed inset-y-0 left-0 z-50 flex flex-col bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 transition-all duration-300 shadow-2xl',
      isOpen ? 'w-64' : 'w-20'
    )}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-700 bg-slate-900/50">
        {isOpen && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <h1 className="font-bold text-base text-white tracking-wide">Datebuk Admin</h1>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="ml-auto text-slate-300 hover:text-white hover:bg-slate-700"
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                'hover:bg-slate-700/50',
                isActive 
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/20' 
                  : 'text-slate-300 hover:text-white'
              )}
            >
              <Icon size={20} className={cn(
                "flex-shrink-0 transition-all",
                isActive && "text-amber-400"
              )} />
              {isOpen && (
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block truncate">{item.label}</span>
                  {item.description && (
                    <span className="text-[10px] text-slate-400 block truncate">
                      {item.description}
                    </span>
                  )}
                </div>
              )}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r" />
              )}
            </Link>
          );
        })}

        <div className="pt-4">
          {isOpen && (
            <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Video Monitor
            </div>
          )}
          {videoMonitorItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  'hover:bg-slate-700/50',
                  isActive 
                    ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shadow-lg shadow-amber-500/20' 
                    : 'text-slate-300 hover:text-white'
                )}
              >
                <Icon size={20} className={cn(
                  "flex-shrink-0 transition-all",
                  isActive && "text-amber-400"
                )} />
                {isOpen && (
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">{item.label}</span>
                    {item.description && (
                      <span className="text-[10px] text-slate-400 block truncate">
                        {item.description}
                      </span>
                    )}
                  </div>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-500 rounded-r" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Add Staff Button */}
      <div className="px-3 py-4 border-t border-slate-700">
        <Link
          href="/staff/directory"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
            'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
            'text-white shadow-lg hover:shadow-xl',
            !isOpen && 'justify-center px-2'
          )}
        >
          <UserPlus size={20} className="flex-shrink-0" />
          {isOpen && <span className="text-sm font-semibold">Add Staff</span>}
        </Link>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 space-y-2 bg-slate-900/50">
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start text-red-400 hover:bg-red-900/30 hover:text-red-300',
            !isOpen && 'justify-center'
          )}
          onClick={handleLogout}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {isOpen && <span className="ml-2">Logout</span>}
        </Button>
        {isOpen && (
          <div className="text-[10px] text-slate-500 text-center pt-2">
            v2.1.0 • Admin Portal
          </div>
        )}
      </div>
    </aside>
  );
}

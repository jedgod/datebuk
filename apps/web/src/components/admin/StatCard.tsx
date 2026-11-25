import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  isPositive?: boolean;
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  icon?: LucideIcon;
}

export function StatCard({
  title,
  value,
  trend,
  isPositive = true,
  variant = 'default',
  icon: Icon,
}: StatCardProps) {
  const getBgColor = () => {
    switch (variant) {
      case 'destructive':
        return 'bg-red-500/10';
      case 'success':
        return 'bg-green-500/10';
      case 'warning':
        return 'bg-yellow-500/10';
      default:
        return 'bg-blue-500/10';
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        {Icon && (
          <div className={cn('p-2 rounded-md', getBgColor())}>
            <Icon size={20} className="text-slate-700" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          {trend && (
            <div className={cn(
              'text-xs font-medium flex items-center gap-1',
              isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              {isPositive ? (
                <TrendingUp size={14} />
              ) : (
                <TrendingDown size={14} />
              )}
              {trend}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

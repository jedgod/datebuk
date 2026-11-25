import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

interface RiskScoreGaugeProps {
  score: number;
  maxScore?: number;
  threshold?: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export function RiskScoreGauge({
  score,
  maxScore = 100,
  threshold = {
    low: 20,
    medium: 40,
    high: 80,
    critical: 100,
  },
}: RiskScoreGaugeProps) {
  const riskLevel = useMemo(() => {
    if (score <= threshold.low) return 'Low';
    if (score <= threshold.medium) return 'Medium';
    if (score <= threshold.high) return 'High';
    return 'Critical';
  }, [score, threshold]);

  const riskColor = useMemo(() => {
    if (score <= threshold.low) return 'text-green-600';
    if (score <= threshold.medium) return 'text-yellow-600';
    if (score <= threshold.high) return 'text-orange-600';
    return 'text-destructive';
  }, [score, threshold]);

  const bgColor = useMemo(() => {
    if (score <= threshold.low) return 'bg-green-500';
    if (score <= threshold.medium) return 'bg-yellow-500';
    if (score <= threshold.high) return 'bg-orange-500';
    return 'bg-destructive';
  }, [score, threshold]);

  const Icon = useMemo(() => {
    if (score <= threshold.low) return CheckCircle;
    if (score <= threshold.medium) return AlertTriangle;
    return AlertCircle;
  }, [score, threshold]);

  const percentage = (score / maxScore) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Current Risk Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Gauge Circle */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {/* Background arc */}
              <svg className="absolute w-full h-full" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="25%" stopColor="#eab308" />
                    <stop offset="50%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="url(#riskGradient)"
                  strokeWidth="12"
                  strokeDasharray={`${(percentage / 100) * 565.5} 565.5`}
                  strokeLinecap="round"
                  transform="rotate(-90 100 100)"
                />
              </svg>

              {/* Center content */}
              <div className="flex flex-col items-center justify-center z-10">
                <Icon size={32} className={riskColor} />
                <div className={cn('text-4xl font-bold', riskColor)}>
                  {Math.round(score)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {riskLevel} Risk
                </div>
              </div>
            </div>
          </div>

          {/* Risk Levels */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Low (0-{threshold.low})</span>
              <span className="text-xs font-medium text-green-600">Safe</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Medium ({threshold.low}-{threshold.medium})</span>
              <span className="text-xs font-medium text-yellow-600">Caution</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">High ({threshold.medium}-{threshold.high})</span>
              <span className="text-xs font-medium text-orange-600">Warning</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Critical ({threshold.high}+)</span>
              <span className="text-xs font-medium text-destructive">Danger</span>
            </div>
          </div>

          {/* Description */}
          <div className={cn(
            'p-3 rounded-md text-sm',
            score <= threshold.low && 'bg-green-500/10 text-green-800 dark:text-green-200',
            score > threshold.low && score <= threshold.medium && 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-200',
            score > threshold.medium && score <= threshold.high && 'bg-orange-500/10 text-orange-800 dark:text-orange-200',
            score > threshold.high && 'bg-destructive/10 text-destructive'
          )}>
            {score <= threshold.low && '✓ System is secure - no immediate action needed'}
            {score > threshold.low && score <= threshold.medium && '⚠ Monitor closely - some elevated risk factors detected'}
            {score > threshold.medium && score <= threshold.high && '⚠ Take action - significant risk detected'}
            {score > threshold.high && '🚨 Critical risk - immediate investigation required'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

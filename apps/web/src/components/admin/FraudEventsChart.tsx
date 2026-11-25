import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

interface FraudEventsChartProps {
  data?: Array<{ time: string; events: number }>;
  isLoading?: boolean;
}

export function FraudEventsChart({ data, isLoading }: FraudEventsChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fraud Events (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-80">
            <Loader2 className="animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use provided data or fallback to mock
  const chartData = data || Array.from({ length: 24 }, (_, i) => ({
    time: `${i}:00`,
    events: Math.floor(Math.random() * 50),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fraud Events Trend (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="time" 
              stroke="#6b7280"
            />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="events" 
              stroke="#f59e0b" 
              dot={false}
              name="Events"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

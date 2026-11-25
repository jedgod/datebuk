import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface IpEvent {
  ip: string;
  country: string;
  riskScore: number;
  detections?: number;
  lastSeen?: string;
}

interface IpFraudTableProps {
  items?: IpEvent[];
  isLoading?: boolean;
}

export function IpFraudTable({ items, isLoading }: IpFraudTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-slate-900">Top Fraud IPs (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-48">
            <Loader2 className="animate-spin text-slate-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const mockData: IpEvent[] = [
    {
      ip: '203.0.113.45',
      country: 'Nigeria',
      detections: 12,
      riskScore: 85,
      lastSeen: '2 mins ago',
    },
    {
      ip: '198.51.100.1',
      country: 'United States',
      detections: 8,
      riskScore: 72,
      lastSeen: '15 mins ago',
    },
    {
      ip: '192.0.2.100',
      country: 'China',
      detections: 15,
      riskScore: 92,
      lastSeen: '5 mins ago',
    },
  ];

  const data = items?.length ? items : mockData;

  const getRiskColor = (score: number) => {
    if (score <= 20) return 'bg-green-100 text-green-800';
    if (score <= 40) return 'bg-yellow-100 text-yellow-800';
    if (score <= 80) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 20) return 'Low';
    if (score <= 40) return 'Medium';
    if (score <= 80) return 'High';
    return 'Critical';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-slate-900">Top Fraud IPs (24h)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP Address</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Detections</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Last Seen</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item: IpEvent) => (
                <TableRow key={item.ip}>
                  <TableCell className="font-mono text-sm">{item.ip}</TableCell>
                  <TableCell>{item.country}</TableCell>
                  <TableCell>
                    <span className="font-semibold">{item.detections ?? 0}</span>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn('font-bold', getRiskColor(item.riskScore))}>
                      {item.riskScore} ({getRiskLabel(item.riskScore)})
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {item.lastSeen ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Block
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

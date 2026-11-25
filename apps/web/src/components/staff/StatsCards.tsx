// components/staff/StatsCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Clock, MessageSquare, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

type StatsProps = {
  openTickets: number;
  aht: string;
  csat: string;
  onStartChat?: () => void;
  onNewTicket?: () => void;
};

export function StatsCards({ openTickets, aht, csat, onStartChat, onNewTicket }: StatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{openTickets}</div>
          <p className="text-xs text-muted-foreground">+14 from yesterday</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Handle Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{aht}</div>
          <p className="text-xs text-green-600">↓ 18s improvement</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">CSAT Score</CardTitle>
          <Star className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{csat}</div>
          <p className="text-xs text-muted-foreground">Based on last 50 ratings</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onStartChat} disabled={!onStartChat}>
            Start Chat
          </Button>
          <Button variant="secondary" size="sm" onClick={onNewTicket} disabled={!onNewTicket}>
            New Ticket
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

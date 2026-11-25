// components/staff/TicketTable.tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";

type Ticket = {
  id: string;
  customer: string;
  status: string;
  priority: string;
  age: string;
};

type Props = {
  tickets: Ticket[];
  selectedId?: string;
  onSelect: (ticket: Ticket) => void;
};

export function TicketTable({ tickets, selectedId, onSelect }: Props) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Ticket #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Age</TableHead>
            <TableHead className="w-20">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow
              key={ticket.id}
              className={cn(
                "transition-colors hover:bg-muted/60",
                selectedId === ticket.id && "bg-muted"
              )}
            >
              <TableCell className="font-medium">#{ticket.id}</TableCell>
              <TableCell>{ticket.customer}</TableCell>
              <TableCell>
                <Badge variant={ticket.status === "Pending" ? "secondary" : "outline"}>
                  {ticket.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    ticket.priority === "High" ? "destructive" : ticket.priority === "Medium" ? "default" : "outline"
                  }
                >
                  {ticket.priority}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{ticket.age}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant={selectedId === ticket.id ? "primary" : "outline"}
                  onClick={() => onSelect(ticket)}
                  className="gap-1"
                >
                  <Eye className="h-4 w-4" />
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

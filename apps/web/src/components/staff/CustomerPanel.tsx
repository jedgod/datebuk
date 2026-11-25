"use client";

// components/staff/CustomerPanel.tsx
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, AlertCircle } from "lucide-react";

type Ticket = {
  id: string;
  customer: string;
  status?: string;
  priority?: string;
  priorityNote?: string;
  notes?: string[];
  assignedTo?: string;
};

type Props = {
  ticket: Ticket;
  onEndChatResolve?: (ticketId: string) => void;
  onTransfer?: (ticketId: string) => void;
  onAddNote?: (ticketId: string, note: string) => void;
  onUpdatePriorityNote?: (ticketId: string, note: string) => void;
};

export function CustomerPanel({ ticket, onEndChatResolve, onTransfer, onAddNote, onUpdatePriorityNote }: Props) {
  const [priorityNote, setPriorityNote] = useState(ticket.priorityNote ?? "");
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    setPriorityNote(ticket.priorityNote ?? "");
    setNoteDraft("");
  }, [ticket.id, ticket.priorityNote]);

  const handleAddNote = () => {
    const trimmed = noteDraft.trim();
    if (!trimmed) return;
    onAddNote?.(ticket.id, trimmed);
    setNoteDraft("");
  };

  const handleSavePriorityNote = () => {
    onUpdatePriorityNote?.(ticket.id, priorityNote.trim());
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-6 border-b bg-card">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={`https://i.pravatar.cc/150?u=${ticket.customer}`} />
            <AvatarFallback>{ticket.customer[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-lg">{ticket.customer}</h3>
            <p className="text-sm text-muted-foreground">johndoe@example.com</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ticket.status && <Badge variant="outline">{ticket.status}</Badge>}
              {ticket.priority && <Badge variant="secondary">{ticket.priority}</Badge>}
              {ticket.assignedTo && <Badge variant="outline">Assigned: {ticket.assignedTo}</Badge>}
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Mail className="mr-2 h-4 w-4" /> Email
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Phone className="mr-2 h-4 w-4" /> Call
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div>
          <h4 className="mb-2 flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4 text-amber-600" /> Priority Note
          </h4>
          <Textarea
            value={priorityNote}
            onChange={(event) => setPriorityNote(event.target.value)}
            placeholder="Add a priority note for this ticket"
            rows={3}
          />
          <div className="mt-2 flex justify-end">
            <Button variant="secondary" size="sm" onClick={handleSavePriorityNote}>
              Save Priority Note
            </Button>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="mb-3 text-sm font-medium">Recent Messages</h4>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-lg bg-muted p-3 text-sm">
                You have issue with product delivery?
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <div className="flex-1 rounded-lg bg-primary/10 p-3 text-sm text-right">
                Yes, order #98432 not received yet
              </div>
              <Avatar className="h-8 w-8">
                <AvatarFallback>You</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="mb-2 text-sm font-medium">Internal Notes</h4>
          <div className="space-y-2">
            {(ticket.notes ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              (ticket.notes ?? []).map((note, index) => (
                <div key={`${ticket.id}-note-${index}`} className="rounded-md bg-muted p-3 text-sm">
                  {note}
                </div>
              ))
            )}
          </div>
          <Textarea
            className="mt-3"
            value={noteDraft}
            onChange={(event) => setNoteDraft(event.target.value)}
            placeholder="Add an internal note"
            rows={3}
          />
        </div>
      </div>

      <div className="border-t p-4 bg-card">
        <Button className="w-full" onClick={() => onEndChatResolve?.(ticket.id)}>
          End Chat & Resolve
        </Button>
        <div className="mt-2 flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => onTransfer?.(ticket.id)}>
            Transfer
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={handleAddNote}>
            Add Note
          </Button>
        </div>
      </div>
    </div>
  );
}

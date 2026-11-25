"use client";

import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, StickyNote, User, Lock } from "lucide-react";
import { useState } from "react";

export default function StaffNotesPage() {
  const [search, setSearch] = useState("");

  const notes = [
    {
      id: "note_1",
      title: "User reported multiple times for inappropriate behavior",
      content: "User ID: user_123. Three reports in the last week. Consider temporary suspension.",
      author: "Sarah Johnson",
      createdAt: "2 hours ago",
      relatedTo: "user_123",
      type: "user",
      priority: "high",
    },
    {
      id: "note_2",
      title: "Payment issue with premium subscription",
      content: "Ticket #456 - User's card was declined. Reached out to payment processor.",
      author: "Mike Chen",
      createdAt: "5 hours ago",
      relatedTo: "ticket_456",
      type: "ticket",
      priority: "medium",
    },
    {
      id: "note_3",
      title: "Investigation: Potential bot accounts",
      content: "Noticed pattern of suspicious profile creation from same IP range. Monitoring.",
      author: "Emma Davis",
      createdAt: "1 day ago",
      relatedTo: "investigation_789",
      type: "security",
      priority: "high",
    },
  ];

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(search.toLowerCase()) ||
      note.content.toLowerCase().includes(search.toLowerCase()) ||
      note.author.toLowerCase().includes(search.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "user":
        return <User className="w-4 h-4" />;
      case "security":
        return <Lock className="w-4 h-4" />;
      default:
        return <StickyNote className="w-4 h-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Notes</h1>
            <p className="text-slate-600 dark:text-slate-400">Internal notes on users, tickets, and investigations</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{notes.length}</div>
              <div className="text-sm text-slate-600">Total Notes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {notes.filter((n) => n.priority === "high").length}
              </div>
              <div className="text-sm text-slate-600">High Priority</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {notes.filter((n) => n.createdAt.includes("hour")).length}
              </div>
              <div className="text-sm text-slate-600">Added Today</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search notes by title, content, or author..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <div key={note.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(note.type)}
                      <h3 className="font-semibold">{note.title}</h3>
                    </div>
                    <Badge className={getPriorityColor(note.priority)}>{note.priority}</Badge>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{note.content}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span>By {note.author}</span>
                      <span>Related to: {note.relatedTo}</span>
                    </div>
                    <span>{note.createdAt}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Note Form */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Add Note</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input placeholder="Note title..." />
              <Textarea placeholder="Note content..." rows={4} />
              <div className="flex items-center gap-3">
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option>Select type</option>
                  <option value="user">User</option>
                  <option value="ticket">Ticket</option>
                  <option value="security">Security</option>
                  <option value="general">General</option>
                </select>
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option>Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                <Button>Save Note</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

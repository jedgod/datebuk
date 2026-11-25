import { NextResponse } from "next/server";

const mockNotifications = [
  {
    id: "notif_001",
    type: "match",
    title: "New Match",
    body: "You have a new match.",
    read: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: "notif_002",
    type: "message",
    title: "New Message",
    body: "You received a new message.",
    read: true,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
];

export async function GET() {
  return NextResponse.json(mockNotifications, { status: 200 });
}

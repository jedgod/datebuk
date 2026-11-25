import { redirect } from "next/navigation";

// Consolidated onto /dashboard/messages (the actively-maintained, fuller-
// featured "Enterprise" version) — see ultra_datebuk-08-01-2026.txt, M-8.
export default function MessagesPage() {
  redirect("/dashboard/messages");
}

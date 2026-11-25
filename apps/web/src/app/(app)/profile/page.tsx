import { redirect } from "next/navigation";

// This "lightweight" profile page and /dashboard/profile ("Enterprise")
// were two independently-maintained copies of the same feature, already
// visibly diverging (this one worked; the dashboard one had regressed to a
// "coming soon" stub). Consolidated onto /dashboard/profile as the single
// canonical version — see ultra_datebuk-08-01-2026.txt, finding M-8.
export default function ProfilePage() {
  redirect("/dashboard/profile");
}

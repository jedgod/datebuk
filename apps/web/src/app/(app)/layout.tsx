import type { Metadata } from "next";

export const revalidate = 0;

import { HeaderClient } from "./HeaderClient";
import { VerifyEmailBanner } from "@/components/VerifyEmailBanner";

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/datebuk_mobileApp.png", sizes: "any", type: "image/png" },
    ],
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <HeaderClient />
      <VerifyEmailBanner />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}

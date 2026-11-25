import type { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/datebuk_Admin.png", sizes: "any", type: "image/png" },
    ],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

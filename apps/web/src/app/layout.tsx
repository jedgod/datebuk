import type { Metadata } from "next";
import "./globals.css";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "DateBuk",
  description: "Modern dating app monorepo starter",
  icons: {
    icon: [
      { url: "/datebuk_logo.png", sizes: "any", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased text-black">
        <img 
          src="/hero-bg.png" 
          alt="background"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            opacity: 0.9,
            pointerEvents: 'none'
          }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vanishing Song Dashboard",
  description: "Internal campaign dashboard for The Vanishing Song — festival submissions, promo calendar, and media contacts.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- intentional:
            the design spec requires this exact Google Fonts stylesheet URL,
            loaded once here in the root layout (not per-page). */}
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@800;900&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

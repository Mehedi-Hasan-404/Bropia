import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "M3U8 Player",
  description: "Play M3U8 streams with custom cookies",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

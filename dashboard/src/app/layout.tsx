import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daraja Developer Toolkit",
  description: "Never lose another M-Pesa webhook again",
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

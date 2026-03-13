import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Salary vs Cost of Living Calculator | Relocation Affordability Tool",
  description:
    "Compare take-home pay and housing affordability across all 50 states. Buy vs rent, taxes, PMI, and real relocation cost analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-white text-slate-900 antialiased`}
      >
        <div className="flex min-h-screen flex-col">
          <main className="flex-1">{children}</main>

        </div>
      </body>
    </html>
  );
}
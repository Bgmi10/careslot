import "./globals.css";
import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import Nav from "@/components/Nav";

const font = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-main" });

export const metadata: Metadata = { title: "CareSlot: book health services", description: "Book physiotherapy, diet consults and lab tests online." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={font.variable}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">
        <Nav />
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteShell from "@/components/site-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "desRefusAcs 2.0",
  description: "Galeri digital tanpa dewan juri.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}

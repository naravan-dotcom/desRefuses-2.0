import "./globals.css";
import SiteShell from "@/components/site-shell";
import ToastContainer from "@/components/toast";

export const metadata = {
  title: "desRefusés 2.0 — Salon Tanpa Juri",
  description: "Galeri digital tanpa dewan juri.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className="h-full scroll-smooth antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Public+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <SiteShell>{children}</SiteShell>
        <ToastContainer />
      </body>
    </html>
  );
}

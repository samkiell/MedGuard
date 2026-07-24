import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MedGuard | Clinical Polypharmacy & Drug Safety Portal",
  description: "Clinical drug-safety and interaction monitoring tool powered by Ontomorph Digital Twins.",
  icons: {
    icon: "/assets/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-sky-500/20 selection:text-sky-400">
        {children}
      </body>
    </html>
  );
}

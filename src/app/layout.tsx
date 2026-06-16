import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Lumina — Clareza Financeira",
  description: "Consolide suas contas do Open Finance brasileiro em uma só visão.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <Providers>
          <div id="__app" className="flex min-h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col md:ml-[252px] min-w-0">
              <Header />
              <main className="flex-1 px-4 md:px-8 py-6 max-w-[1440px] w-full mx-auto">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

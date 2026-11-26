"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { FeedbackWidget } from "@/components/feedback-widget";
import { SpotlightLayer } from "@/components/fx/spotlight";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const bare = path === "/login" || path === "/onboarding" || path === "/upgrade" || path.startsWith("/connect") || path.startsWith("/auth");

  if (bare) return <div id="__app"><SpotlightLayer />{children}</div>;

  return (
    <div id="__app" className="flex min-h-screen">
      <SpotlightLayer />
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-[252px] min-w-0">
        <Header />
        <main className="flex-1 px-4 md:px-8 pt-6 pb-24 md:pb-10 max-w-[1440px] w-full mx-auto">{children}</main>
      </div>
      <FeedbackWidget />
    </div>
  );
}

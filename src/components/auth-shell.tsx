"use client";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { FeedbackWidget } from "@/components/feedback-widget";

export function AuthShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const bare = path === "/login" || path === "/onboarding" || path === "/connect" || path.startsWith("/auth");

  if (bare) return <div id="__app">{children}</div>;

  return (
    <div id="__app" className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-[252px] min-w-0">
        <Header />
        <main className="flex-1 px-4 md:px-8 py-6 max-w-[1440px] w-full mx-auto">{children}</main>
      </div>
      <FeedbackWidget />
    </div>
  );
}

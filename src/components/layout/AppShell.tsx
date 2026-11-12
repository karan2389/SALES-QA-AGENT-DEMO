"use client";
import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { DatasetProvider } from "@/hooks/useDataset";
import { DateRangeProvider } from "@/hooks/useDateRange";
import { usePersistentState } from "@/hooks/usePersistentState";
import { ToastProvider } from "@/components/ui/Toast";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

function Shell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = usePersistentState("ffci:sidebar-collapsed", false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <div className="flex h-dvh overflow-hidden">
      <div className="hidden shrink-0 lg:block"><Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} /></div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 animate-in"><Sidebar collapsed={false} mobile onClose={() => setMobileOpen(false)} /></div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main id="main" className="flex-1 overflow-y-auto scroll-thin">
          <div className="mx-auto w-full max-w-[1480px] px-3 py-5 sm:px-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <DateRangeProvider>
        <DatasetProvider><Shell>{children}</Shell></DatasetProvider>
      </DateRangeProvider>
    </ToastProvider>
  );
}

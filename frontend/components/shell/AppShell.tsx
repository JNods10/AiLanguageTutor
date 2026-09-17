"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import Overlay from "@/components/ui/Overlay";
import Button from "@/components/ui/Button";
import { MenuIcon } from "@/components/ui/icons";

type AppShellProps = {
  sidebar: React.ReactNode;
  children: React.ReactNode;
};

export default function AppShell({ sidebar, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-full min-h-screen">
      {sidebarOpen && (
        <Overlay
          onClose={closeSidebar}
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[var(--sidebar-width)] flex-col border-r border-border bg-background transition-transform md:static md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center border-b border-border px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Open sidebar"
            className="rounded-md"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon size={20} />
          </Button>
        </div>

        {children}
      </div>
    </div>
  );
}

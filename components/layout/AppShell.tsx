"use client";

import * as React from "react";

import { FinanceProvider, useFinance } from "@/components/providers/FinanceProvider";

import { AppLockGuard } from "../providers/AppLockGuard";
import { BottomNav } from "./BottomNav";

function Shell({ children }: { children: React.ReactNode }) {
  const { ready } = useFinance();
  if (!ready) {
    return <div className="flex min-h-dvh items-center justify-center text-muted-foreground">در حال آماده‌سازی دفتر مالی...</div>;
  }
  return (
    <main className="mx-auto min-h-dvh max-w-[430px] overflow-hidden bg-background shadow-2xl sm:my-6 sm:min-h-[calc(100dvh-3rem)] sm:rounded-[2rem] sm:border">
      <div className="min-h-dvh pb-24 sm:min-h-[calc(100dvh-3rem)]">{children}</div>
      <BottomNav />
    </main>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <FinanceProvider><AppLockGuard><Shell>{children}</Shell></AppLockGuard></FinanceProvider>;
}

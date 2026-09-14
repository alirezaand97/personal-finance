"use client";

import { useEffect, useState } from "react";

import { LockScreen } from "@/components/lock-screen/LockScreen";
import { isAppLockEnabled } from "@/lib/security/lock";

export function AppLockGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locked, setLocked] = useState<boolean | null>(null);

  useEffect(() => {
    setLocked(isAppLockEnabled());
  }, []);

  if (locked === null) {
    return null;
  }

  if (locked) {
    return <LockScreen onUnlock={() => setLocked(false)} />;
  }

  return <>{children}</>;
}
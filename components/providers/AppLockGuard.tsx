"use client";
import { useEffect, useState } from "react";
import { LockScreen } from "@/components/lock-screen/LockScreen";
import {
  hasUnlockedThisSession,
  isAppLockEnabled,
  markUnlockedThisSession,
} from "@/lib/security/lock";

export function AppLockGuard({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState<boolean | null>(null);

  useEffect(() => {
    // اگه قفل اصلاً فعال نیست، یا این تب/session قبلاً یک‌بار باز شده،
    // دیگه لازم نیست دوباره قفل نشون بدیم (مثلاً موقع رفرش کردن صفحه).
    const shouldLock = isAppLockEnabled() && !hasUnlockedThisSession();
    setLocked(shouldLock);
  }, []);

  if (locked === null) {
    return null;
  }

  if (locked) {
    return (
      <LockScreen
        onUnlock={() => {
          markUnlockedThisSession();
          setLocked(false);
        }}
      />
    );
  }

  return <>{children}</>;
}

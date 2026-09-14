"use client";

import { Check, Delete, Fingerprint, ShieldCheck } from "lucide-react";
import {
  hasBiometric,
  hasPin,
  verifyBiometric,
  verifyPin,
} from "@/lib/security/lock";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 8;

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checkingBiometric, setCheckingBiometric] = useState(false);

  const biometricAvailable = hasBiometric();
  const pinAvailable = hasPin();

  const tryBiometric = async () => {
    if (checkingBiometric) return;

    setCheckingBiometric(true);
    setError("");

    try {
      const ok = await verifyBiometric();

      if (ok) {
        onUnlock();
      } else if (!pinAvailable) {
        setError("تأیید ناموفق بود.");
      }
    } finally {
      setCheckingBiometric(false);
    }
  };

  useEffect(() => {
    if (biometricAvailable) {
      tryBiometric();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitPin = async () => {
    if (pin.length < MIN_PIN_LENGTH) {
      setError(`پین باید حداقل ${MIN_PIN_LENGTH} رقم باشد.`);
      return;
    }

    const ok = await verifyPin(pin);

    if (ok) {
      onUnlock();
      return;
    }

    setError("پین اشتباه است.");
    setPin("");
  };

  const press = (digit: string) => {
    setError("");

    setPin((current) => {
      if (current.length >= MAX_PIN_LENGTH) return current;
      return current + digit;
    });
  };

  const removeLast = () => {
    setError("");
    setPin((current) => current.slice(0, -1));
  };

  const keypad = [
    { value: "1", label: "۱" },
    { value: "2", label: "۲" },
    { value: "3", label: "۳" },
    { value: "4", label: "۴" },
    { value: "5", label: "۵" },
    { value: "6", label: "۶" },
    { value: "7", label: "۷" },
    { value: "8", label: "۸" },
    { value: "9", label: "۹" },
  ];

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-6">
      <div className="w-full max-w-3xs">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-6" strokeWidth={1.8} />
          </div>

          <h1 className="mt-4 text-base font-semibold">برنامه قفل است</h1>

          <p className="mt-1 text-xs text-muted-foreground">
            برای ادامه پین خود را وارد کنید
          </p>
        </div>

        {/* Biometric */}
        {biometricAvailable && (
          <button
            type="button"
            onClick={tryBiometric}
            disabled={checkingBiometric}
            className="mx-auto mt-5 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-primary transition-all active:scale-95 disabled:opacity-50"
          >
            <Fingerprint className="size-4" strokeWidth={1.8} />

            {checkingBiometric ? "در حال بررسی..." : "ورود با اثرانگشت / چهره"}
          </button>
        )}

        {/* PIN */}
        {pinAvailable && (
          <div className="mt-6">
            {/* PIN indicators */}
            <div className="flex min-h-4 justify-center gap-2" dir="ltr">
              {Array.from({
                length: Math.max(MIN_PIN_LENGTH, pin.length),
              }).map((_, index) => {
                const filled = index < pin.length;

                return (
                  <span
                    key={index}
                    className={[
                      "size-2 rounded-full transition-all duration-150",
                      filled
                        ? "scale-110 bg-primary"
                        : "bg-muted-foreground/20",
                    ].join(" ")}
                  />
                );
              })}
            </div>
            {/* Error */}
            <div className="mt-3 h-4 text-center">
              {error && (
                <p className="text-[11px] font-medium text-destructive">
                  {error}
                </p>
              )}
            </div>

            {/* Keypad */}
            <div className="mt-4 grid grid-cols-3 gap-4" dir="ltr">
              {keypad.map((digit) => (
                <Button
                  key={digit.value}
                  type="button"
                  variant="outline"
                  onClick={() => press(digit.value)}
                  className="h-14 rounded-xl border-border/20! bg-background text-lg font-semibold! text-gray-500! shadow-none transition-all active:scale-95"
                >
                  <span>{digit.label}</span>
                </Button>
              ))}
              {/* Confirm */}
              <Button
                type="button"
                onClick={submitPin}
                disabled={pin.length < MIN_PIN_LENGTH}
                className="h-14 rounded-xl shadow-none transition-all active:scale-95 disabled:opacity-30"
              >
                <Check />
              </Button>

              {/* Zero */}
              <Button
                type="button"
                variant="outline"
                onClick={() => press("0")}
                className="h-14 rounded-xl border-border/20! bg-background text-lg font-semibold! text-gray-500! shadow-none transition-all active:scale-95"
              >
                <span>۰</span>
              </Button>
              {/* Delete */}
              <Button
                type="button"
                variant="ghost"
                onClick={removeLast}
                disabled={!pin.length}
                className="h-14 rounded-xl text-muted-foreground active:scale-95 disabled:opacity-20"
              >
                <Delete />
              </Button>
            </div>

            <p className="mt-4 text-center text-[10px] text-muted-foreground/50">
              پین می‌تواند بین ۴ تا ۸ رقم باشد
            </p>
          </div>
        )}

        {/* No security */}
        {!pinAvailable && !biometricAvailable && (
          <p className="mt-8 text-center text-xs text-muted-foreground">
            قفلی برای برنامه تنظیم نشده است.
          </p>
        )}
      </div>
    </div>
  );
}

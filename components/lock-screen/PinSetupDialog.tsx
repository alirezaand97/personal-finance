import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { hasPin, setPin, verifyPin } from "@/lib/security/lock";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PinSetupDialog({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<"current" | "new" | "confirm">("new");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const alreadySet = hasPin();
    setStep(alreadySet ? "current" : "new");
    setCurrent("");
    setNext("");
    setConfirm("");
    setError("");
  }, [open]);

  const digitsOnly = (v: string) => v.replace(/\D/g, "").slice(0, 8);

  const proceedFromCurrent = async () => {
    if (current.length < 4) {
      setError("پین فعلی را کامل وارد کنید.");
      return;
    }
    const ok = await verifyPin(current);
    if (!ok) {
      setError("پین فعلی درست نیست.");
      return;
    }
    setError("");
    setStep("new");
  };

  const proceedFromNew = () => {
    if (next.length < 4) {
      setError("پین باید حداقل ۴ رقم باشد.");
      return;
    }
    setError("");
    setStep("confirm");
  };

  const finish = async () => {
    if (confirm !== next) {
      setError("پین‌ها یکسان نیستند. دوباره تلاش کنید.");
      setNext("");
      setConfirm("");
      setStep("new");
      return;
    }
    await setPin(next);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {step === "current"
              ? "پین فعلی را وارد کنید"
              : step === "new"
                ? "پین جدید"
                : "تکرار پین جدید"}
          </DialogTitle>
          <DialogDescription>
            {step === "current"
              ? "برای تغییر پین، ابتدا پین فعلی را تأیید کنید."
              : step === "new"
                ? "یک پین ۴ تا ۸ رقمی انتخاب کنید."
                : "همان پین را دوباره وارد کنید."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === "current" && (
            <Input
              autoFocus
              inputMode="numeric"
              type="password"
              value={current}
              onChange={(e) => setCurrent(digitsOnly(e.target.value))}
              placeholder="پین فعلی"
              className="h-14 text-center text-2xl tracking-[0.5em]"
            />
          )}
          {step === "new" && (
            <Input
              autoFocus
              inputMode="numeric"
              type="password"
              value={next}
              onChange={(e) => setNext(digitsOnly(e.target.value))}
              placeholder="••••"
              className="h-14 text-center text-2xl tracking-[0.5em]"
            />
          )}
          {step === "confirm" && (
            <Input
              autoFocus
              inputMode="numeric"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(digitsOnly(e.target.value))}
              placeholder="••••"
              className="h-14 text-center text-2xl tracking-[0.5em]"
            />
          )}

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              انصراف
            </Button>
            <Button
              className="flex-1"
              onClick={
                step === "current"
                  ? proceedFromCurrent
                  : step === "new"
                    ? proceedFromNew
                    : finish
              }
            >
              {step === "confirm" ? "ذخیره پین" : "ادامه"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

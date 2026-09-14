import * as React from "react";

import { AppSettings, db, exportBackup, importBackup } from "@/lib/finance";
import {
  ArrowDownLeft,
  ArrowUpLeft,
  Download,
  FileUp,
  Fingerprint,
  Lock,
  Moon,
  Package,
  Plane,
  ReceiptText,
  Settings,
  ShieldCheck,
  Trash2,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  disableAppLock,
  hasBiometric,
  hasPin,
  isBiometricAvailable,
  registerBiometric,
} from "@/lib/security/lock";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { PinSetupDialog } from "@/components/lock-screen/PinSetupDialog";
import { Select } from "@/components/ui/select";

export function SettingsScreen({
  settings,
  onSettings,
  onRefresh,
}: {
  settings: AppSettings;
  onSettings: (s: AppSettings) => void;
  onRefresh: () => void;
}) {
  const file = useRef<HTMLInputElement>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [securityError, setSecurityError] = useState("");

  useEffect(() => {
    setPinEnabled(hasPin());
    setBiometricEnabled(hasBiometric());
    isBiometricAvailable().then(setBiometricSupported);
  }, []);

  const update = async (p: Partial<AppSettings>) => {
    const s = { ...settings, ...p };
    await db.settings.put(s);
    onSettings(s);
  };
  const backup = async () => {
    const blob = new Blob([await exportBackup()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `hamrah-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const restore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const payload = JSON.parse(await f.text());
      if (
        !payload ||
        typeof payload !== "object" ||
        (!Array.isArray(payload.transactions) &&
          !Array.isArray(payload.categories))
      )
        throw new Error("invalid");
      await importBackup(payload);
      await onRefresh();
    } catch {
      alert("فایل پشتیبان معتبر نیست.");
    }
    e.target.value = "";
  };
  const clear = async () => {
    const { clearAll } = await import("@/lib/finance");
    await clearAll();
    setClearOpen(false);
    await onRefresh();
  };

  const enableBiometric = async () => {
  setSecurityError("");

  try {
    await registerBiometric();
    setBiometricEnabled(true);
  } catch (error) {
    console.error(error);

    setSecurityError(
      error instanceof Error
        ? error.message
        : "فعال‌سازی بیومتریک ناموفق بود."
    );
  }
};

  const turnOffLock = () => {
    disableAppLock();
    setPinEnabled(false);
    setBiometricEnabled(false);
  };

  return (
    <>
      <Header title="تنظیمات" />
      <div className="flex flex-col gap-4 px-4 pb-28">
        <SettingsSection title="ظاهر برنامه">
          <SettingRow label="حالت نمایش">
            <Select
              value={settings.mode}
              onValueChange={(v) => update({ mode: v as AppSettings["mode"] })}
              options={[
                { value: "system", label: "سیستم", icon: Settings },
                { value: "light", label: "روشن", icon: Wallet },
                { value: "dark", label: "تیره", icon: Moon },
              ]}
              className="w-32"
            />
          </SettingRow>
          <SettingRow label="رنگ برنامه">
            <Select
              value={settings.preset}
              onValueChange={(v) =>
                update({ preset: v as AppSettings["preset"] })
              }
              options={[
                { value: "default", label: "خنثی", icon: Package },
                { value: "green", label: "سبز مالی", icon: TrendingUp },
                { value: "blue", label: "آبی آرام", icon: Plane },
              ]}
              className="w-32"
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="نمایش اعداد">
          <SettingRow label="رقم‌ها">
            <Select
              value={settings.digitStyle}
              onValueChange={(v) =>
                update({ digitStyle: v as AppSettings["digitStyle"] })
              }
              options={[
                { value: "fa", label: "فارسی ۱۲۳", icon: ArrowDownLeft },
                { value: "en", label: "لاتین 123", icon: ArrowUpLeft },
              ]}
              className="w-32"
            />
          </SettingRow>
          <SettingRow label="جداکننده اعداد">
            <Select
              value={settings.separatorStyle}
              onValueChange={(v) =>
                update({ separatorStyle: v as AppSettings["separatorStyle"] })
              }
              options={[
                { value: "persian", label: "۱۲٬۳۴۵", icon: ReceiptText },
                { value: "comma", label: "12,345", icon: ReceiptText },
              ]}
              className="w-32"
            />
          </SettingRow>
          <SettingRow label="واحد پول">
            <Input
              value={settings.currency}
              onChange={(e) => update({ currency: e.target.value })}
              className="h-9 w-24 text-left"
            />
          </SettingRow>
        </SettingsSection>

        <SettingsSection title="امنیت و قفل برنامه">
          <SettingRow label="قفل با کد پین">
            <Button
              size="sm"
              variant={pinEnabled ? "secondary" : "outline"}
              onClick={() => setPinDialogOpen(true)}
            >
              <Lock className="size-3.5" />
              {pinEnabled ? "تغییر پین" : "تنظیم پین"}
            </Button>
          </SettingRow>

          {biometricSupported && (
            <SettingRow label="ورود با اثرانگشت / چهره">
              <Button
                size="sm"
                variant={biometricEnabled ? "secondary" : "outline"}
                onClick={enableBiometric}
                disabled={biometricEnabled}
              >
                <Fingerprint className="size-3.5" />
                {biometricEnabled ? "فعال است" : "فعال‌سازی"}
              </Button>
            </SettingRow>
          )}

          {(pinEnabled || biometricEnabled) && (
            <div className="pt-2">
              <div className="flex items-start gap-2 rounded-lg bg-primary/[0.06] p-3 text-xs text-muted-foreground">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>
                  از این پس هر بار که برنامه را باز کنید، قبل از دیدن اطلاعات
                  مالی از شما پین یا اثرانگشت خواسته می‌شود. این قفل فقط روی
                  همین دستگاه و مرورگر ذخیره می‌شود.
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-destructive hover:text-destructive"
                onClick={turnOffLock}
              >
                غیرفعال کردن قفل برنامه
              </Button>
            </div>
          )}

          {securityError && (
            <p className="pt-2 text-xs text-destructive">{securityError}</p>
          )}
        </SettingsSection>

        <SettingsSection title="پشتیبان‌گیری">
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start rounded-xl border-border/60 bg-white px-4 py-2 h-auto"
              onClick={backup}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Download className="size-4" />
              </span>

              <span className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">دریافت فایل پشتیبان</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  ذخیره اطلاعات در قالب فایل
                </span>
              </span>
            </Button>

            <Button
              variant="outline"
              className=" w-full justify-start rounded-xl border-border/60 bg-white px-4 py-2 h-auto"
              onClick={() => file.current?.click()}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FileUp className="size-4" />
              </span>

              <span className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">بازیابی از فایل</span>
                <span className="text-[11px] font-normal text-muted-foreground">
                  وارد کردن اطلاعات از فایل پشتیبان
                </span>
              </span>
            </Button>

            <input
              ref={file}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={restore}
            />

            <Button
              variant="outline"
              className=" w-full justify-start rounded-xl border-destructive/20  text-destructive hover:bg-destructive/[0.07] hover:text-destructive px-4 py-2 h-auto bg-rose-50/30"
              onClick={() => setClearOpen(true)}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-destructive/10">
                <Trash2 className="size-4" />
              </span>

              <span className="flex flex-col items-start gap-0.5">
                <span className="text-sm font-medium">
                  پاک کردن همه اطلاعات
                </span>
                <span className="text-[11px] font-normal text-destructive/60">
                  حذف دائمی تمام تراکنش‌ها و اطلاعات
                </span>
              </span>
            </Button>
          </div>
        </SettingsSection>
        <p className="text-center text-xs text-muted-foreground">
          همراه مالی · اطلاعات شما فقط روی همین دستگاه ذخیره می‌شود.
        </p>
      </div>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>پاک کردن همه اطلاعات</DialogTitle>
            <DialogDescription>
              تمام تراکنش‌ها و دسته‌بندی‌ها حذف و دسته‌بندی‌های پیش‌فرض دوباره
              ساخته می‌شوند.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setClearOpen(false)}
            >
              انصراف
            </Button>
            <Button variant="destructive" className="flex-1" onClick={clear}>
              پاک کردن
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PinSetupDialog
        open={pinDialogOpen}
        onClose={() => setPinDialogOpen(false)}
        onSaved={() => setPinEnabled(true)}
      />
    </>
  );
}

export function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">{children}</CardContent>
    </Card>
  );
}

export function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-12 items-center justify-between gap-4 border-b py-2.5 last:border-0">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}

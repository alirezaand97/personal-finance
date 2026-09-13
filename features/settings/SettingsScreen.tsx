import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownLeft, ArrowUpLeft, BarChart3, BriefcaseBusiness, CarFront,
  ChevronLeft, ChevronRight, Download, Edit3, FileUp, Gamepad2, Gift,
  HeartPulse, Home, House, Laptop, MoreHorizontal, Moon, Package, Plane,
  Plus, ReceiptText, RefreshCw, Search, Settings, ShoppingBag, Trash2,
  TrendingUp, Trophy, Utensils, Wallet, X, Tags, TrendingDown, Repeat,
  Landmark, Gem, Bitcoin, Banknote, ArrowLeftRight, type LucideIcon,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PersianDatePicker } from "@/components/ui/react-multi-date-picker";
import { TransactionType, DigitStyle, SeparatorStyle, ThemeMode, ThemePreset, Transaction, Category, InvestmentCategory, InvestmentUnit, Investment, InvestmentTransactionKind, InvestmentTransaction, StockQuote, StockSyncMeta, MarketKind, MarketQuote, MarketSyncMeta, PortfolioSnapshot, defaultInvestmentCategories, AppSettings, expenseCategories, incomeCategories, db, seedDatabase, toFa, formatNumber, formatMoney, monthNames, jalaliLabel, todayIso, startOfCurrentMonth, isSameDay, groupByDate, exportBackup, importBackup, clearAll, getAll, uid, filterPeriod, formatCompact, dayWord, defaultSettings, Screen, ChartPoint, needsStockSync, exactTime, getStockSyncMeta, syncStockQuotes, searchStockQuotes, getStockQuote, getMarketSyncMeta, syncMarketQuotes, searchMarketQuotes, getMarketQuote, savePortfolioSnapshot, getPortfolioSnapshots } from "@/lib/finance";

import { Header } from "@/components/layout/Header";

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
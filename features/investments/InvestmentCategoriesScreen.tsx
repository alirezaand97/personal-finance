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
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { EmptyState } from "@/components/transactions/EmptyState";

export function InvestmentCategoriesScreen({
  investmentCategories,
  investments,
  onRefresh,
}: {
  investmentCategories: InvestmentCategory[];
  investments: Investment[];
  onRefresh: () => void;
}) {
  const [editor, setEditor] = useState<{
    category?: InvestmentCategory;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvestmentCategory | null>(
    null,
  );

  const iconOptions = [
    ["stock", "سهام", TrendingUp],
    ["gold", "طلا و سکه", Gem],
    ["currency", "ارز", Banknote],
    ["crypto", "ارز دیجیتال", Bitcoin],
    ["fund", "صندوق", Landmark],
    ["realestate", "املاک", House],
    ["other", "سایر", Package],
  ] as const;

  const remove = async () => {
    if (!deleteTarget) return;
    await db.investmentCategories.delete(deleteTarget.id);
    setDeleteTarget(null);
    await onRefresh();
  };

  return (
    <>
      <Header
        title="دسته‌بندی سرمایه‌گذاری"
        action={
          <Button size="icon" variant="ghost" onClick={() => setEditor({})}>
            <Plus />
          </Button>
        }
      />
      <div className="flex flex-col gap-4 px-4 pb-28">
        <div className="flex flex-col gap-2">
          {investmentCategories.map((c) => {
            const count = investments.filter(
              (i) => i.categoryId === c.id,
            ).length;
            return (
              <Card key={c.id} className="flex items-center gap-3 p-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <CategoryIcon category={c} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatNumber(count, {
                      digitStyle: "fa",
                      separatorStyle: "persian",
                    })}{" "}
                    مورد
                  </p>
                </div>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setEditor({ category: c })}
                  aria-label="ویرایش"
                >
                  <Edit3 />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget(c)}
                  aria-label="حذف"
                >
                  <Trash2 />
                </Button>
              </Card>
            );
          })}
          {!investmentCategories.length && (
            <EmptyState onAdd={() => setEditor({})} />
          )}
        </div>
      </div>

      <InvestmentCategoryEditor
        open={!!editor}
        category={editor?.category}
        iconOptions={iconOptions}
        onClose={() => setEditor(null)}
        onSaved={onRefresh}
      />
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف دسته‌بندی</DialogTitle>
            <DialogDescription>{deleteTarget?.name} حذف شود؟</DialogDescription>
          </DialogHeader>
          {deleteTarget &&
            investments.some((i) => i.categoryId === deleteTarget.id) && (
              <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                این دسته‌بندی سرمایه‌گذاری دارد. با حذف آن، آن سرمایه‌گذاری‌ها
                بدون دسته‌بندی معتبر باقی می‌مانند.
              </div>
            )}
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              انصراف
            </Button>
            <Button variant="destructive" className="flex-1" onClick={remove}>
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function InvestmentCategoryEditor({
  open,
  category,
  iconOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  category?: InvestmentCategory;
  iconOptions: readonly (readonly [string, string, LucideIcon])[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("other");
  const [color, setColor] = useState("");

  useEffect(() => {
    setName(category?.name ?? "");
    setIcon(category?.icon || "other");
    setColor(category?.color || "");
  }, [category, open]);

  const save = async () => {
    const clean = name.trim();
    if (!clean) return;
    if (category)
      await db.investmentCategories.update(category.id, {
        name: clean,
        icon,
        color,
      });
    else
      await db.investmentCategories.add({
        id: uid(),
        name: clean,
        icon,
        color,
        createdAt: new Date().toISOString(),
      });
    await onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {category ? "ویرایش دسته‌بندی" : "دسته‌بندی سرمایه‌گذاری جدید"}
          </DialogTitle>
          <DialogDescription>
            نام و آیکون دسته‌بندی را انتخاب کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="مثلاً صندوق طلا"
          />
          <div>
            <p className="mb-2 text-sm font-medium">آیکون</p>
            <div className="grid grid-cols-5 gap-2">
              {iconOptions.map(([key, label, Icon]) => (
                <button
                  type="button"
                  key={key}
                  title={label}
                  aria-label={label}
                  onClick={() => setIcon(key)}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl border transition-colors hover:bg-muted",
                    icon === key &&
                      "border-primary bg-primary/10 text-primary ring-2 ring-primary/20",
                  )}
                >
                  <Icon className="size-5" />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">رنگ اختیاری</p>
            <div className="flex gap-2">
              {[
                "#33a77b",
                "#7b78ed",
                "#f3ae53",
                "#e77a8b",
                "#56a6c8",
                "#9b83cf",
              ].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label="انتخاب رنگ"
                  className={cn(
                    "size-7 rounded-full border-2",
                    color === c && "ring-2 ring-ring ring-offset-2",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <Button className="w-full" onClick={save} disabled={!name.trim()}>
            {category ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
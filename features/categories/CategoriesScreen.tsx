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

export function CategoriesScreen({
  categories,
  transactions,
  onRefresh,
}: {
  categories: Category[];
  transactions: Transaction[];
  onRefresh: () => void;
}) {
  const [type, setType] = useState<TransactionType>("expense");
  const [editor, setEditor] = useState<{ category?: Category } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const filtered = categories.filter((c) => c.type === type);

  const iconOptions = [
    ["utensils", "خوراک", Utensils],
    ["restaurant", "رستوران", Utensils],
    ["transport", "حمل‌ونقل", CarFront],
    ["shopping", "خرید", ShoppingBag],
    ["bills", "قبوض", ReceiptText],
    ["housing", "مسکن", House],
    ["health", "سلامت", HeartPulse],
    ["entertainment", "تفریح", Gamepad2],
    ["travel", "سفر", Plane],
    ["salary", "حقوق", BriefcaseBusiness],
    ["freelance", "فریلنسری", Laptop],
    ["investment", "سرمایه‌گذاری", TrendingUp],
    ["gift", "هدیه", Gift],
    ["bonus", "پاداش", Trophy],
    ["other", "سایر", Package],
  ] as const;

  const remove = async () => {
    if (!deleteTarget) return;
    await db.categories.delete(deleteTarget.id);
    setDeleteTarget(null);
    await onRefresh();
  };

  return (
    <>
      <Header
        title="دسته‌بندی‌ها"
        action={
          <Button size="icon" variant="ghost" onClick={() => setEditor({})}>
            <Plus />
          </Button>
        }
      />
      <div className="flex flex-col gap-4 px-4 pb-28">
        <div className="flex w-full rounded-xl bg-muted/60 p-1">
          {(
            [
              ["expense", "هزینه‌ها"],
              ["income", "درآمدها"],
            ] as const
          ).map(([id, label]) => {
            const active = type === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setType(id)}
                className={cn(
                  "relative flex h-9 flex-1 items-center justify-center rounded-lg",
                  "text-sm! font-medium! transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          {filtered.map((c) => {
            const count = transactions.filter(
              (t) => t.categoryId === c.id,
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
                    تراکنش
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
          {!filtered.length && <EmptyState onAdd={() => setEditor({})} />}
        </div>
      </div>

      <CategoryEditor
        open={!!editor}
        category={editor?.category}
        type={type}
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
            transactions.some((t) => t.categoryId === deleteTarget.id) && (
              <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
                این دسته‌بندی تراکنش دارد. با حذف آن، تراکنش‌ها باقی می‌مانند
                اما دسته‌بندی‌شان «سایر» نمایش داده می‌شود.
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

export function CategoryEditor({
  open,
  category,
  type,
  iconOptions,
  onClose,
  onSaved,
}: {
  open: boolean;
  category?: Category;
  type: TransactionType;
  iconOptions: readonly (readonly [string, string, LucideIcon])[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("other");
  const [color, setColor] = useState("");
  const [budget, setBudget] = useState("");
  useEffect(() => {
    setName(category?.name ?? "");
    setIcon(category?.icon || "other");
    setColor(category?.color || "");
    setBudget(category?.monthlyBudget ? String(category.monthlyBudget) : "");
  }, [category, open]);

  const save = async () => {
    const clean = name.trim();
    if (!clean) return;
    const monthlyBudget = budget.trim()
      ? Number(budget.replace(/\D/g, ""))
      : undefined;
    if (category)
      await db.categories.update(category.id, {
        name: clean,
        icon,
        color,
        monthlyBudget,
      });
    else
      await db.categories.add({
        id: uid(),
        name: clean,
        type,
        icon,
        color,
        monthlyBudget,
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
            {category ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
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
            placeholder="مثلاً آموزش"
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
          {type === "expense" && (
            <div>
              <p className="mb-2 text-sm font-medium">بودجه ماهانه (اختیاری)</p>
              <Input
                inputMode="numeric"
                value={
                  budget
                    ? Number(budget.replace(/\D/g, "")).toLocaleString("en-US")
                    : ""
                }
                onChange={(e) => setBudget(e.target.value)}
                placeholder="مثلاً ۲۰۰۰۰۰۰"
              />
            </div>
          )}
          <Button className="w-full" onClick={save} disabled={!name.trim()}>
            {category ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
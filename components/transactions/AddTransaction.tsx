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
import { categoryIconMap } from "@/components/common/CategoryIcon";

export function AddTransaction({
  open,
  transaction,
  categories,
  settings,
  onClose,
  onSaved,
}: {
  open: boolean;
  transaction: Transaction | null;
  categories: Category[];
  settings: AppSettings;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? "expense",
  );
  const [amount, setAmount] = useState(String(transaction?.amount ?? ""));
  const [title, setTitle] = useState(transaction?.title ?? "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [date, setDate] = useState(transaction?.date ?? todayIso());
  const [note, setNote] = useState(transaction?.note ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    setType(transaction?.type ?? "expense");
    setAmount(String(transaction?.amount ?? ""));
    setTitle(transaction?.title ?? "");
    setCategoryId(transaction?.categoryId ?? "");
    setDate(transaction?.date ?? todayIso());
    setNote(transaction?.note ?? "");
    setError("");
  }, [transaction, open]);

  const choices = categories.filter((c) => c.type === type);
  useEffect(() => {
    if (!choices.some((c) => c.id === categoryId))
      setCategoryId(choices[0]?.id ?? "");
  }, [type, categories, choices, categoryId]);

  const save = async () => {
    const value = Number(amount.replace(/\D/g, ""));
    if (!value || !title.trim() || !categoryId) {
      setError("لطفاً مبلغ، عنوان و دسته را کامل کنید.");
      return;
    }
    const now = new Date().toISOString();
    const data = {
      type,
      amount: value,
      title: title.trim(),
      categoryId,
      date,
      note: note.trim(),
      updatedAt: now,
      createdAt: transaction?.createdAt ?? now,
    };
    if (transaction) await db.transactions.update(transaction.id, data);
    else await db.transactions.add({ id: uid(), ...data });
    await onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? "ویرایش تراکنش" : "ثبت تراکنش"}
          </DialogTitle>
          <DialogDescription>
            مبلغ، عنوان و دسته‌بندی را وارد کنید.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex w-full rounded-xl bg-muted/60 p-1">
            {(
              [
                ["expense", "هزینه"],
                ["income", "درآمد"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setType(id)}
                className={cn(
                  "relative flex h-9 flex-1 items-center justify-center rounded-lg",
                  "text-sm! font-medium! transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  id === type
                    ? "bg-primary text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              مبلغ ({settings.currency})
            </label>
            <Input
              autoFocus
              inputMode="numeric"
              value={
                amount
                  ? Number(amount.replace(/\D/g, "")).toLocaleString("en-US")
                  : ""
              }
              onChange={(e) => setAmount(e.target.value)}
              placeholder="۰"
              className="h-14 text-2xl font-bold"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">عنوان</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً خرید هفتگی"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">دسته‌بندی</label>
            <Select
              value={categoryId}
              onValueChange={setCategoryId}
              options={choices.map((c) => ({
                value: c.id,
                label: c.name,
                icon: categoryIconMap[c.icon] || Package,
              }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-2 block text-sm font-medium">تاریخ</label>
              <PersianDatePicker value={date} onChange={setDate} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">یادداشت</label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="اختیاری"
              />
            </div>
          </div>
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <Button className="h-11 w-full rounded-xl" onClick={save}>
            {transaction ? "ذخیره تغییرات" : "ذخیره تراکنش"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
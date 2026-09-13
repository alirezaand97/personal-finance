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
import { TransactionRow } from "@/components/transactions/TransactionRow";
import { EmptyState } from "@/components/transactions/EmptyState";

export function TransactionsScreen({
  transactions,
  categories,
  settings,
  onAdd,
  onEdit,
  onRefresh,
}: {
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
  onAdd: () => void;
  onEdit: (t: Transaction) => void;
  onRefresh: () => void;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"all" | TransactionType>("all");
  const [sort, setSort] = useState("new");
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [repeatTarget, setRepeatTarget] = useState<Transaction | null>(null);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const map = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const list = useMemo(
    () =>
      transactions
        .filter((t) => {
          const query = q.trim().toLocaleLowerCase("fa-IR");
          return (
            (type === "all" || t.type === type) &&
            (!query ||
              `${t.title} ${map.get(t.categoryId)?.name ?? ""} ${t.note ?? ""}`
                .toLocaleLowerCase("fa-IR")
                .includes(query))
          );
        })
        .sort((a, b) =>
          sort === "new"
            ? b.date.localeCompare(a.date)
            : sort === "old"
              ? a.date.localeCompare(b.date)
              : sort === "high"
                ? b.amount - a.amount
                : a.amount - b.amount,
        ),
    [transactions, q, type, sort, map],
  );

  const grouped = groupByDate(list);
  const deleteTransaction = async () => {
    if (!deleteTarget) return;
    await db.transactions.delete(deleteTarget.id);
    setDeleteTarget(null);
    await onRefresh();
  };

  const repeatTransaction = async () => {
    if (!repeatTarget) return;
    const now = new Date().toISOString();
    await db.transactions.add({
      id: uid(),
      type: repeatTarget.type,
      amount: repeatTarget.amount,
      title: repeatTarget.title,
      categoryId: repeatTarget.categoryId,
      date: todayIso(),
      note: repeatTarget.note,
      createdAt: now,
      updatedAt: now,
    });
    setRepeatTarget(null);
    await onRefresh();
  };

  return (
    <>
      <Header
        title="تراکنش‌ها"
        action={
          <Button size="icon" variant="ghost" onClick={onAdd}>
            <Plus />
          </Button>
        }
      />
      <div className="flex flex-col gap-4 px-4 pb-28">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="جست‌وجوی تراکنش..."
            className="h-11 pr-9"
          />
        </div>
        <div className="flex items-center gap-2 pb-1">
          {(
            [
              ["all", "همه"],
              ["income", "درآمد"],
              ["expense", "هزینه"],
            ] as const
          ).map(([id, label]) => (
            <Button
              key={id}
              size="sm"
              variant={type === id ? "default" : "outline"}
              className="rounded-md text-sm!"
              onClick={() => setType(id)}
            >
              {label}
            </Button>
          ))}
          <Select
            value={sort}
            onValueChange={setSort}
            className="ms-auto min-w-32 shrink-0"
            options={[
              { value: "new", label: "جدیدترین" },
              { value: "old", label: "قدیمی‌ترین" },
              { value: "high", label: "بیشترین مبلغ" },
              { value: "low", label: "کمترین مبلغ" },
            ]}
          />
        </div>

        {Object.keys(grouped).length === 0 ? (
          <EmptyState onAdd={onAdd} />
        ) : (
          Object.entries(grouped).map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-2 text-xs font-semibold text-muted-foreground">
                {date}
              </h2>
              <div className="flex flex-col gap-2">
                {items.map((t) => (
                  <TransactionRow
                    key={t.id}
                    transaction={t}
                    category={map.get(t.categoryId)}
                    settings={settings}
                    onEdit={() => {
                      setOpenRowId(null);
                      onEdit(t);
                    }}
                    onDelete={() => {
                      setOpenRowId(null);
                      setDeleteTarget(t);
                    }}
                    onRepeat={() => {
                      setOpenRowId(null);
                      setRepeatTarget(t);
                    }}
                    revealed={openRowId === t.id}
                    onToggle={() =>
                      setOpenRowId((cur) => (cur === t.id ? null : t.id))
                    }
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف تراکنش</DialogTitle>
            <DialogDescription>
              این تراکنش برای همیشه حذف می‌شود. این عمل قابل بازگشت نیست.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted p-3 text-sm">
            {deleteTarget?.title} ·{" "}
            {deleteTarget && formatMoney(deleteTarget.amount, settings)}
          </div>
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              انصراف
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={deleteTransaction}
            >
              حذف تراکنش
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!repeatTarget}
        onOpenChange={(v) => !v && setRepeatTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>تکرار تراکنش برای امروز</DialogTitle>
            <DialogDescription>
              یک تراکنش جدید با همین مشخصات، با تاریخ امروز ثبت می‌شود.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-muted p-3 text-sm">
            {repeatTarget?.title} ·{" "}
            {repeatTarget && formatMoney(repeatTarget.amount, settings)}
          </div>
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRepeatTarget(null)}
            >
              انصراف
            </Button>
            <Button className="flex-1" onClick={repeatTransaction}>
              تکرار برای امروز
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
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
import { investmentUnitLabel, formatQuantity } from "@/features/investments/utils";

export function InvestmentTransactionEditor({
  open,
  investment,
  transaction,
  defaultKind,
  investmentTransactions,
  settings,
  onClose,
  onSaved,
}: {
  open: boolean;
  investment: Investment;
  transaction?: InvestmentTransaction;
  defaultKind?: InvestmentTransactionKind;
  investmentTransactions: InvestmentTransaction[];
  settings: AppSettings;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<InvestmentTransactionKind>("buy");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setKind(transaction?.kind ?? defaultKind ?? "buy");
    setQuantity(transaction ? String(transaction.quantity) : "");
    setUnitPrice(
      transaction
        ? String(transaction.unitPrice)
        : investment.currentPrice
          ? String(investment.currentPrice)
          : "",
    );
    setAmount(transaction ? String(transaction.amount) : "");
    setDate(transaction?.date ?? todayIso());
    setNote(transaction?.note ?? "");
    setError("");
  }, [transaction, defaultKind, investment, open]);

  const availableQuantity = useMemo(() => {
    return investmentTransactions
      .filter(
        (t) => t.investmentId === investment.id && t.id !== transaction?.id,
      )
      .reduce((sum, t) => {
        if (t.kind === "buy" || t.kind === "initial") return sum + t.quantity;
        if (t.kind === "sell") return sum - t.quantity;
        return sum;
      }, 0);
  }, [investmentTransactions, investment.id, transaction]);

  useEffect(() => {
    if (kind === "buy" || kind === "sell" || kind === "initial") {
      const q = Number(quantity);
      const p = Number(unitPrice.replace(/\D/g, ""));
      if (q > 0 && p > 0) setAmount(String(Math.round(q * p)));
    }
  }, [quantity, unitPrice, kind]);

   const save = async () => {
    const q = Number(quantity.replace(",", "."));
    const p = Number(unitPrice.replace(/\D/g, ""));
    const value =
      kind === "buy" || kind === "sell" || kind === "initial"
        ? Math.round(q * p)
        : Number(amount.replace(/\D/g, ""));

    if (
      (kind === "buy" || kind === "sell" || kind === "initial") &&
      (!q || q <= 0 || !p || p <= 0)
    ) {
      setError("تعداد و قیمت واحد را وارد کنید.");
      return;
    }

    if ((kind === "dividend" || kind === "fee") && (!value || value <= 0)) {
      setError("مبلغ را وارد کنید.");
      return;
    }

    if (kind === "sell" && q > availableQuantity + 1e-9) {
      setError(
        `موجودی قابل فروش: ${formatQuantity(Math.max(0, availableQuantity))} ${investmentUnitLabel(investment.unit)}`,
      );
      return;
    }

    const now = new Date().toISOString();
    const payload = {
      investmentId: investment.id,
      kind,
      quantity: kind === "buy" || kind === "sell" || kind === "initial" ? q : 0,
      unitPrice: kind === "buy" || kind === "sell" || kind === "initial" ? p : 0,
      amount: value,
      date,
      note: note.trim(),
      updatedAt: now,
    };

    if (transaction) {
      await db.investmentTransactions.update(transaction.id, payload);
    } else {
      await db.investmentTransactions.add({
        id: uid(),
        ...payload,
        createdAt: now,
      });
    }

    await onSaved();
    onClose();
  };

  const isTrade = kind === "buy" || kind === "sell" || kind === "initial";
  
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {transaction ? "ویرایش تراکنش" : `ثبت تراکنش · ${investment.name}`}
          </DialogTitle>
          <DialogDescription>
            موجودی فعلی: {formatQuantity(availableQuantity)}{" "}
            {investmentUnitLabel(investment.unit)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
             <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {(
              [
                ["buy", "خرید", ArrowDownLeft],
                ["sell", "فروش", ArrowUpLeft],
                ["initial", "موجودی اولیه", Landmark],
                ["dividend", "سود نقدی", TrendingUp],
                ["fee", "کارمزد", ReceiptText],
              ] as const
            ).map(([id, label, Icon]) => (
              <button
                key={id}
                type="button"
                onClick={() => setKind(id)}
                className={cn(
                  "flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm! font-medium transition-all",
                  kind === id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="size-3.5" />
                {label}
              </button>
            ))}
          </div>

          {kind === "initial" && (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              موجودی اولیه برای ثبت دارایی‌هایی است که پیش از استفاده از این
              سیستم در اختیار داشته‌اید. این تراکنش روی موجودی نقدی شما اثری
              ندارد.
            </p>
          )}

          {isTrade ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  تعداد ({investmentUnitLabel(investment.unit)})
                </label>
                <Input
                  inputMode="decimal"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  placeholder="مثلاً ۳"
                  className="h-12"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  قیمت هر واحد
                </label>
                <Input
                  inputMode="numeric"
                  value={
                    unitPrice
                      ? Number(unitPrice.replace(/\D/g, "")).toLocaleString(
                          "en-US",
                        )
                      : ""
                  }
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="۰"
                  className="h-12"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium">
                مبلغ ({settings.currency})
              </label>
              <Input
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
          )}

          {isTrade && (
            <div className="rounded-xl bg-muted/50 px-3 py-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">مبلغ تراکنش</span>
                <span className="font-bold">
                  {formatMoney(
                    Number(amount.replace(/\D/g, "")) || 0,
                    settings,
                  )}
                </span>
              </div>
            </div>
          )}

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

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button
            className="h-11 w-full rounded-xl"
            onClick={save}
            disabled={
              isTrade ? !quantity.trim() || !unitPrice.trim() : !amount.trim()
            }
          >
            {transaction ? "ذخیره تغییرات" : "ثبت تراکنش"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

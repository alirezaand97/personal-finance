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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { TransactionType, DigitStyle, SeparatorStyle, ThemeMode, ThemePreset, Transaction, Category, InvestmentCategory, InvestmentUnit, Investment, InvestmentTransactionKind, InvestmentTransaction, StockQuote, StockSyncMeta, MarketKind, MarketQuote, MarketSyncMeta, PortfolioSnapshot, defaultInvestmentCategories, AppSettings, expenseCategories, incomeCategories, db, seedDatabase, toFa, formatNumber, formatMoney, monthNames, jalaliLabel, todayIso, startOfCurrentMonth, isSameDay, groupByDate, exportBackup, importBackup, clearAll, getAll, uid, filterPeriod, formatCompact, dayWord, defaultSettings, Screen, ChartPoint, needsStockSync, exactTime, getStockSyncMeta, syncStockQuotes, searchStockQuotes, getStockQuote, getMarketSyncMeta, syncMarketQuotes, searchMarketQuotes, getMarketQuote, savePortfolioSnapshot, getPortfolioSnapshots } from "@/lib/finance";
import { CategoryIcon } from "@/components/common/CategoryIcon";

export function TransactionRow({
  transaction,
  category,
  settings,
  onEdit,
  onDelete,
  onRepeat,
  revealed,
  onToggle,
}: {
  transaction: Transaction;
  category?: Category;
  settings: AppSettings;
  onEdit?: () => void;
  onDelete?: () => void;
  onRepeat?: () => void;
  revealed?: boolean;
  onToggle?: () => void;
}) {
  const actionable = !!(onEdit || onDelete || onRepeat);
  return (
    <div
      className="group relative flex items-center gap-3 rounded-md shadow bg-card p-3"
      onClick={actionable ? onToggle : undefined}
      role={actionable ? "button" : undefined}
      tabIndex={actionable ? 0 : undefined}
    >
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          transaction.type === "income"
            ? "bg-primary/10 text-primary"
            : "bg-rose-500/10 text-rose-600",
        )}
      >
        <CategoryIcon category={category} className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{transaction.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {category?.name ?? "سایر"} · {dayWord(transaction.date)}
        </p>
      </div>
      <p
        className={cn(
          "shrink-0 text-sm font-bold",
          transaction.type === "income" ? "text-primary" : "text-rose-600",
        )}
      >
        {formatMoney(transaction.amount, settings)}
      </p>
      {actionable && (
        <div
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 gap-1 rounded-lg bg-background/95 p-1 shadow-sm",
            revealed ? "flex" : "hidden md:group-hover:flex",
          )}
        >
          {onRepeat && (
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onRepeat();
              }}
              aria-label="تکرار برای امروز"
            >
              <Repeat />
            </Button>
          )}
          {onEdit && (
            <Button
              size="icon-sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              aria-label="ویرایش"
            >
              <Edit3 />
            </Button>
          )}
          {onDelete && (
            <Button
              size="icon-sm"
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              aria-label="حذف"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
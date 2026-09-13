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

export function PortfolioTrendCard({
  snapshots,
  settings,
}: {
  snapshots: PortfolioSnapshot[];
  settings: AppSettings;
}) {
  if (snapshots.length < 2) return null;

  const first = snapshots[0];
  const last = snapshots[snapshots.length - 1];

  const portfolioGrowth =
    first.totalValue > 0
      ? ((last.totalValue - first.totalValue) / first.totalValue) * 100
      : 0;
  const usdGrowth =
    first.usdPrice > 0
      ? ((last.usdPrice - first.usdPrice) / first.usdPrice) * 100
      : 0;
  const diff = portfolioGrowth - usdGrowth;

  const points = snapshots.map((s) => ({
    date: new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      month: "short",
      day: "numeric",
    }).format(new Date(s.date)),
    value: s.totalValue,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">روند ارزش سبد</CardTitle>
        <CardDescription>
          {snapshots.length} روز اخیر · مقایسه با دلار
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-40">
          <ResponsiveContainer>
            <LineChart
              data={points}
              margin={{ top: 8, right: 4, left: 4, bottom: 0 }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                opacity={0.18}
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                fontSize={10}
                interval="preserveStartEnd"
              />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                cursor={{ stroke: "var(--muted-foreground)", opacity: 0.2 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-2xl border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-md">
                      <p className="mb-1 text-[11px] text-muted-foreground">
                        {label}
                      </p>
                      <p className="text-sm font-bold">
                        {formatMoney(Number(payload[0].value), settings)}
                      </p>
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-primary/[0.06] p-3">
            <p className="text-xs text-muted-foreground">بازدهی سبد شما</p>
            <p
              className={cn(
                "mt-1 text-sm font-bold",
                portfolioGrowth >= 0 ? "text-primary" : "text-rose-600",
              )}
            >
              {portfolioGrowth >= 0 ? "+" : ""}
              {portfolioGrowth.toFixed(1)}٪
            </p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">رشد دلار</p>
            <p
              className={cn(
                "mt-1 text-sm font-bold",
                usdGrowth >= 0 ? "text-primary" : "text-rose-600",
              )}
            >
              {usdGrowth >= 0 ? "+" : ""}
              {usdGrowth.toFixed(1)}٪
            </p>
          </div>
        </div>

        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          {diff >= 0
            ? `سبد شما ${diff.toFixed(1)}٪ بهتر از دلار عمل کرده است.`
            : `سبد شما ${Math.abs(diff).toFixed(1)}٪ ضعیف‌تر از دلار عمل کرده است.`}
        </p>
      </CardContent>
    </Card>
  );
}
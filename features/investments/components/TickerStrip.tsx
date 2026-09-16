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
export function TickerStrip({
  items,
  settings,
}: {
  items: any[];
  settings: AppSettings;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const directionRef = useRef<1 | -1>(1);
  const isUserInteractingRef = useRef(false);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || items.length < 2) return;

    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (!isUserInteractingRef.current) {
        // سرعت حرکت
        const speed = 0.025; // هرچه کمتر، حرکت آرام‌تر

        container.scrollLeft += directionRef.current * delta * speed;

        const maxScroll =
          container.scrollWidth - container.clientWidth;

        // در RTL مقدار scrollLeft ممکن است منفی باشد
        const current = Math.abs(container.scrollLeft);

        if (current >= maxScroll - 1) {
          directionRef.current = -1;
        }

        if (current <= 1) {
          directionRef.current = 1;
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }

      if (resumeTimeoutRef.current) {
        clearTimeout(resumeTimeoutRef.current);
      }
    };
  }, [items.length]);

  const pauseAutoScroll = () => {
    isUserInteractingRef.current = true;

    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
    }

    // بعد از اینکه کاربر دستش را برداشت،
    // کمی صبر کن و دوباره حرکت خودکار را شروع کن
    resumeTimeoutRef.current = setTimeout(() => {
      isUserInteractingRef.current = false;
    }, 2500);
  };

  if (!items.length) return null;

  return (
    <div
      ref={scrollRef}
      onTouchStart={pauseAutoScroll}
      onWheel={pauseAutoScroll}
      onPointerDown={pauseAutoScroll}
      className="-mx-4 flex cursor-grab gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden active:cursor-grabbing"
    >
      {items.map((item) => {
        const up = item.changePercent >= 0;

        return (
          <div
            key={item.key}
            className="flex min-w-[8.5rem] shrink-0 flex-col gap-1.5 rounded-2xl border bg-card px-3 py-2.5"
          >
            <p className="truncate text-xs text-muted-foreground">
              {item.label}
            </p>

            <p className="text-sm font-bold">
              {formatMoney(item.price, settings)}
            </p>

            <div
              className={cn(
                "flex items-center gap-1 text-[11px] font-medium",
                up ? "text-primary" : "text-rose-600",
              )}
            >
              {up ? (
                <TrendingUp className="size-3" />
              ) : (
                <TrendingDown className="size-3" />
              )}

              <span>
                {Math.abs(item.changePercent).toFixed(2)}٪
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

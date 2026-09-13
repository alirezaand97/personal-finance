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
import type { Category, InvestmentCategory } from "@/lib/finance";

export const categoryIconMap: Record<string, LucideIcon> = {
  utensils: Utensils, restaurant: Utensils, transport: CarFront, shopping: ShoppingBag,
  bills: ReceiptText, housing: House, health: HeartPulse, entertainment: Gamepad2,
  travel: Plane, salary: BriefcaseBusiness, freelance: Laptop, investment: TrendingUp,
  gift: Gift, bonus: Trophy, other: Package, stock: TrendingUp, crypto: Bitcoin,
  gold: Gem, fund: Landmark, realestate: House, currency: Banknote,
};

export function CategoryIcon({
  category,
  className,
}: {
  category?: Category | InvestmentCategory;
  className?: string;
}) {
  const key = category?.icon || "other";
  const Icon = categoryIconMap[key] || Package;
  return <Icon aria-hidden="true" className={className} />;
}

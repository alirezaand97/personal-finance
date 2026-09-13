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
export function MiniCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "rose" | "green";
}) {
  const isIncome = tone === "green";

  return (
    <Card
      className={cn(
        "border-0 p-4 shadow-xs",
        isIncome
          ? "bg-primary/[0.08] text-primary"
          : "bg-rose-500/[0.08] text-rose-600",
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-lg",
            isIncome ? "bg-primary/10" : "bg-rose-500/10",
          )}
        >
          {isIncome ? (
            <ArrowDownLeft className="size-3.5" />
          ) : (
            <ArrowUpLeft className="size-3.5" />
          )}
        </div>

        <span className="text-xs font-medium text-foreground/60">{title}</span>
      </div>

      <p className="mt-3 text-base font-bold tracking-tight text-foreground">
        {value}
      </p>
    </Card>
  );
}
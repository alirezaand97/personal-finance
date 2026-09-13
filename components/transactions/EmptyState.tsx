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
export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="flex flex-col items-center border-dashed px-6 py-12 text-center shadow-none">
      <div className="mb-4 rounded-2xl bg-primary/10 p-4 text-primary">
        <Wallet />
      </div>
      <h2 className="font-bold">هنوز تراکنشی ثبت نشده</h2>
      <p className="mt-2 max-w-[250px] text-sm leading-6 text-muted-foreground">
        با ثبت اولین تراکنش، ردیابی هزینه‌ها و درآمدهای خود را شروع کنید.
      </p>
      <Button className="mt-5 rounded-md" onClick={onAdd}>
        <Plus data-icon="inline-start" /> ثبت اولین تراکنش
      </Button>
    </Card>
  );
}
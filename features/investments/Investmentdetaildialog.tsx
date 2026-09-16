import {
  AppSettings,
  Investment,
  InvestmentCategory,
  InvestmentTransaction,
  dayWord,
  formatMoney,
} from "@/lib/finance";
import {
  ArrowDownLeft,
  ArrowUpLeft,
  Edit3,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatQuantity, getInvestmentMetrics, investmentUnitLabel, transactionKindLabel } from "./utils";

import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/common/CategoryIcon";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

export function InvestmentDetailDialog({
  open,
  investment,
  category,
  investmentTransactions,
  settings,
  onClose,
  onBuy,
  onSell,
  onEditAsset,
  onDeleteAsset,
  onEditTransaction,
  onDeleteTransaction,
}: {
  open: boolean;
  investment: Investment | null;
  category?: InvestmentCategory;
  investmentTransactions: InvestmentTransaction[];
  settings: AppSettings;
  onClose: () => void;
  onBuy: (investment: Investment) => void;
  onSell: (investment: Investment) => void;
  onEditAsset: (investment: Investment) => void;
  onDeleteAsset: (investment: Investment) => void;
  onEditTransaction: (t: InvestmentTransaction) => void;
  onDeleteTransaction: (t: InvestmentTransaction) => void;
}) {
  const metrics = useMemo(() => {
    if (!investment) return null;
    return getInvestmentMetrics(investment, investmentTransactions);
  }, [investment, investmentTransactions]);
 
  const history = useMemo(() => {
    if (!investment) return [];
    return investmentTransactions
      .filter((t) => t.investmentId === investment.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [investment, investmentTransactions]);
 
  if (!investment || !metrics) return null;
 
  const averageBuyPrice =
    metrics.quantity > 0 ? metrics.netInvested / metrics.quantity : 0;
 
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CategoryIcon category={category} className="size-5" />
            </span>
            <div className="min-w-0 flex-1 text-start">
              <DialogTitle className="flex items-center gap-1.5 truncate">
                {investment.name}
                {investment.symbolId && (
                  <span className="rounded-sm bg-primary/10 px-1.5 text-[9px] font-normal text-primary">
                    زنده
                  </span>
                )}
              </DialogTitle>
              <DialogDescription>
                {category?.name ?? "سایر"} · {investmentUnitLabel(investment.unit)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
 
        <div className="space-y-4">
          {/* ارزش فعلی + سود/زیان */}
          <div className="rounded-2xl bg-primary/[0.06] p-4">
            <p className="text-xs text-muted-foreground">ارزش فعلی</p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              {formatMoney(metrics.currentValue, settings)}
            </p>
            <p
              className={cn(
                "mt-1 text-sm font-medium",
                metrics.profit >= 0 ? "text-primary" : "text-rose-600",
              )}
            >
              {metrics.profit >= 0 ? "+" : ""}
              {formatMoney(metrics.profit, settings)} (
              {metrics.profitPercent.toFixed(1)}٪)
            </p>
          </div>
 
          {/* جزئیات ریز */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[11px] text-muted-foreground">موجودی</p>
              <p className="mt-1 text-sm font-bold">
                {formatQuantity(metrics.quantity)}{" "}
                <span className="font-normal text-muted-foreground">
                  {investmentUnitLabel(investment.unit)}
                </span>
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[11px] text-muted-foreground">قیمت فعلی هر واحد</p>
              <p className="mt-1 text-sm font-bold">
                {formatMoney(investment.currentPrice, settings)}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[11px] text-muted-foreground">میانگین خرید</p>
              <p className="mt-1 text-sm font-bold">
                {averageBuyPrice > 0
                  ? formatMoney(Math.round(averageBuyPrice), settings)
                  : "—"}
              </p>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="text-[11px] text-muted-foreground">مجموع سرمایه‌گذاری</p>
              <p className="mt-1 text-sm font-bold">
                {formatMoney(metrics.netInvested, settings)}
              </p>
            </div>
            {metrics.dividends > 0 && (
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground">مجموع سود نقدی</p>
                <p className="mt-1 text-sm font-bold">
                  {formatMoney(metrics.dividends, settings)}
                </p>
              </div>
            )}
            {metrics.fees > 0 && (
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-[11px] text-muted-foreground">مجموع کارمزد</p>
                <p className="mt-1 text-sm font-bold">
                  {formatMoney(metrics.fees, settings)}
                </p>
              </div>
            )}
          </div>
 
          {/* اکشن‌های سریع */}
          <div className="flex gap-2">
            <Button className="flex-1 gap-1.5" onClick={() => onBuy(investment)}>
              <ArrowDownLeft className="size-4" />
              خرید
            </Button>
            <Button
              variant="outline"
              className="flex-1 gap-1.5"
              disabled={metrics.quantity <= 0}
              onClick={() => onSell(investment)}
            >
              <ArrowUpLeft className="size-4" />
              فروش
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEditAsset(investment)}
              aria-label="ویرایش دارایی"
            >
              <Edit3 />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onDeleteAsset(investment)}
              aria-label="حذف دارایی"
            >
              <Trash2 />
            </Button>
          </div>
 
          {/* تاریخچه تراکنش‌ها */}
          <div>
            <p className="mb-2 text-sm font-bold">
              تاریخچه تراکنش‌ها ({history.length})
            </p>
            {history.length === 0 ? (
              <p className="rounded-xl bg-muted/40 p-4 text-center text-xs text-muted-foreground">
                هنوز تراکنشی برای این دارایی ثبت نشده.
              </p>
            ) : (
              <div className="flex max-h-64 flex-col gap-2 overflow-y-auto pe-1">
                {history.map((t) => {
                  const isPositive = t.kind === "sell" || t.kind === "dividend";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 rounded-xl border p-2.5"
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg text-xs",
                          isPositive
                            ? "bg-primary/10 text-primary"
                            : "bg-rose-500/10 text-rose-600",
                        )}
                      >
                        {t.kind === "buy" || t.kind === "initial" ? (
                          <ArrowDownLeft className="size-4" />
                        ) : t.kind === "sell" ? (
                          <ArrowUpLeft className="size-4" />
                        ) : (
                          <span className="text-[10px] font-bold">٪</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold">
                          {transactionKindLabel(t.kind)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {dayWord(t.date)}
                          {(t.kind === "buy" ||
                            t.kind === "sell" ||
                            t.kind === "initial") &&
                            ` · ${formatQuantity(t.quantity)} ${investmentUnitLabel(investment.unit)}`}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 text-xs font-bold",
                          isPositive ? "text-primary" : "text-rose-600",
                        )}
                      >
                        {isPositive ? "+" : "-"}
                        {formatMoney(t.amount, settings)}
                      </p>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => onEditTransaction(t)}
                          aria-label="ویرایش تراکنش"
                        >
                          <Edit3 className="size-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => onDeleteTransaction(t)}
                          aria-label="حذف تراکنش"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
 

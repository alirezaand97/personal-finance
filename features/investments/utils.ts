import type { Investment, InvestmentTransaction, InvestmentCategory } from "@/lib/finance";

export function getInvestmentMetrics(investment: Investment, transactions: InvestmentTransaction[]) {
  const rows = transactions.filter((t) => t.investmentId === investment.id);
  const buyQty = rows.filter((t) => t.kind === "buy" || t.kind === "initial").reduce((s, t) => s + t.quantity, 0);
  const sellQty = rows.filter((t) => t.kind === "sell").reduce((s, t) => s + t.quantity, 0);
  const quantity = Math.max(0, buyQty - sellQty);
  const buyAmount = rows.filter((t) => t.kind === "buy" || t.kind === "initial").reduce((s, t) => s + t.amount, 0);
  const sellAmount = rows.filter((t) => t.kind === "sell").reduce((s, t) => s + t.amount, 0);
  const fees = rows.filter((t) => t.kind === "fee").reduce((s, t) => s + t.amount, 0);
  const dividends = rows.filter((t) => t.kind === "dividend").reduce((s, t) => s + t.amount, 0);
  const netInvested = buyAmount - sellAmount + fees;
  const currentValue = quantity * investment.currentPrice;
  const profit = currentValue - netInvested + dividends;
  const profitPercent = netInvested > 0 ? (profit / netInvested) * 100 : 0;
  return { rows, quantity, buyAmount, sellAmount, fees, dividends, netInvested, currentValue, profit, profitPercent };
}

export function investmentCashFlow(transactions: InvestmentTransaction[]) {
  return transactions.reduce((sum, t) => {
    if (t.kind === "buy" || t.kind === "fee") return sum + t.amount;
    if (t.kind === "sell" || t.kind === "dividend") return sum - t.amount;
    return sum;
  }, 0);
}

export function investmentUnitLabel(unit: Investment["unit"]) {
  return { piece: "عدد", gram: "گرم", share: "سهم", unit: "واحد" }[unit];
}

export function formatQuantity(value: number) {
  return value.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

export function transactionKindLabel(kind: InvestmentTransaction["kind"]) {
  return { buy: "خرید", sell: "فروش", dividend: "سود نقدی", fee: "کارمزد", initial: "موجودی اولیه" }[kind];
}

export const currencyTickerSymbols = [
  { symbol: "USD", label: "دلار" }, { symbol: "CAD", label: "دلار کانادا" }, { symbol: "EUR", label: "یورو" },
];

export const goldTickerSymbols = [
  { symbol: "IR_GOLD_18K", label: "طلای ۱۸ عیار" }, { symbol: "IR_GOLD_24K", label: "طلای ۲۴ عیار" },
  { symbol: "IR_COIN_1G", label: "سکه یک گرمی" }, { symbol: "IR_COIN_QUARTER", label: "ربع سکه" },
  { symbol: "IR_COIN_HALF", label: "نیم سکه" }, { symbol: "IR_COIN_EMAMI", label: "سکه امامی" },
  { symbol: "IR_COIN_BAHAR", label: "سکه بهار آزادی" },
];

export type LiveMarketKind = "stock" | "gold" | "currency" | "crypto";
export const liveCategoryIcons: LiveMarketKind[] = ["stock", "gold", "currency", "crypto"];
export function getTodayChangeAmount(currentValue: number, changePercent: number) {
  return currentValue - currentValue / (1 + changePercent / 100);
}

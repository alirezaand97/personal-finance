import { persianDateParts, persianMonthLength, todayIso } from "./formatting"

import type { RecurringBill } from "./types"
import { db } from "./db"
import { uid } from "./storage"

/** کلید دوره‌ی جاری به شکل YYYY-MM (بر اساس تقویم جلالی) */
export function currentPeriodKey(date: Date = new Date()) {
  const { year, month } = persianDateParts(date)
  return `${year}-${String(month).padStart(2, "0")}`
}

function effectiveDueDay(dueDay: number, date: Date = new Date()) {
  return Math.min(dueDay, persianMonthLength(date))
}

/** آیا این قبض برای دوره‌ی (ماه جلالی) جاری هنوز پرداخت ثبت نشده و به سررسیدش رسیده؟ */
export function isBillDue(bill: RecurringBill, date: Date = new Date()) {
  if (!bill.active) return false
  if (bill.lastPaidPeriod === currentPeriodKey(date)) return false
  return persianDateParts(date).day >= effectiveDueDay(bill.dueDay, date)
}

/** چند روز تا سررسید این قبض در دوره‌ی جاری مانده (عدد منفی یعنی گذشته) */
export function daysUntilDue(bill: RecurringBill, date: Date = new Date()) {
  return effectiveDueDay(bill.dueDay, date) - persianDateParts(date).day
}

/** لیست قبض‌هایی که الان سررسید شده‌اند، مرتب بر اساس روز سررسید */
export function getDueBills(bills: RecurringBill[], date: Date = new Date()) {
  return bills.filter((b) => isBillDue(b, date)).sort((a, b) => a.dueDay - b.dueDay)
}
export async function saveRecurringBill(
  data: {
    title: string
    amount: number
    categoryId: string
    dueDay: number
    note: string
    active: boolean
    totalInstallments?: number
    paidInstallments?: number
  },
  existing?: RecurringBill,
) {
  const now = new Date().toISOString()
  if (existing) {
    await db.recurringBills.update(existing.id, { ...data, updatedAt: now })
  } else {
    await db.recurringBills.add({
      id: uid(),
      ...data,
      createdAt: now,
      updatedAt: now,
    })
  }
}

export async function deleteRecurringBill(id: string) {
  await db.recurringBills.delete(id)
}

/**
 * این قبض را برای دوره‌ی جاری «پرداخت‌شده» علامت می‌زند: یک تراکنش هزینه‌ی
 * واقعی با تاریخ امروز ثبت می‌کند و دوره‌ی آخرین پرداخت را به‌روز می‌کند.
 */
export async function markBillPaid(bill: RecurringBill) {
  const now = new Date().toISOString()

  await db.transactions.add({
    id: uid(),
    type: "expense",
    amount: bill.amount,
    title: bill.title,
    categoryId: bill.categoryId,
    date: todayIso(),
    note: bill.note,
    createdAt: now,
    updatedAt: now,
  })

  const update: Partial<RecurringBill> = {
    lastPaidPeriod: currentPeriodKey(),
    updatedAt: now,
  }

  // اگر این یک وام/قسط با تعداد مشخص است، شمارنده را بالا ببر و در
  // صورت رسیدن به آخرین قسط، خودکار غیرفعالش کن.
  if (bill.totalInstallments) {
    const newPaid = (bill.paidInstallments ?? 0) + 1
    update.paidInstallments = newPaid
    if (newPaid >= bill.totalInstallments) update.active = false
  }

  await db.recurringBills.update(bill.id, update)
}
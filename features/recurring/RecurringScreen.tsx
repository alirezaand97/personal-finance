import * as React from "react";

import {
  AppSettings,
  Category,
  RecurringBill,
  currentPeriodKey,
  daysUntilDue,
  deleteRecurringBill,
  formatMoney,
  isBillDue,
  markBillPaid,
  saveRecurringBill,
} from "@/lib/finance";
import { ArrowRight, Bell, Edit3, Package, Plus, Trash2 } from "lucide-react";
import {
  CategoryIcon,
  categoryIconMap,
} from "@/components/common/CategoryIcon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function RecurringScreen({
  recurringBills,
  categories,
  settings,
  onRefresh,
}: {
  recurringBills: RecurringBill[];
  categories: Category[];
  settings: AppSettings;
  onRefresh: () => void;
}) {
  const [editor, setEditor] = useState<{ bill?: RecurringBill } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecurringBill | null>(null);
  const expenseCategories = categories.filter((c) => c.type === "expense");

  const sorted = [...recurringBills].sort((a, b) => a.dueDay - b.dueDay);

  const pay = async (bill: RecurringBill) => {
    await markBillPaid(bill);
    await onRefresh();
  };

  const remove = async () => {
    if (!deleteTarget) return;
    await deleteRecurringBill(deleteTarget.id);
    setDeleteTarget(null);
    await onRefresh();
  };

  return (
    <>
      <Header
        title="قبض‌ها و اقساط"
        action={
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={() => setEditor({})}>
              <Plus />
            </Button>
          </div>
        }
      />
      <div className="flex flex-col gap-4 px-4 pb-28">
        <div className="flex flex-col gap-2">
          {sorted.map((bill) => {
            const category = categories.find((c) => c.id === bill.categoryId);
            const due = isBillDue(bill);
            const paidThisPeriod =
              bill.active && bill.lastPaidPeriod === currentPeriodKey();
            const remaining = daysUntilDue(bill);

            return (
              <Card key={bill.id} className="p-3.5">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <CategoryIcon category={category} className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {bill.title}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {category?.name ?? "سایر"} · روز {bill.dueDay} هر ماه
                          {bill.totalInstallments && (
                            <>
                              {" "}
                              · قسط{" "}
                              {Math.min(
                                (bill.paidInstallments ?? 0) + 1,
                                bill.totalInstallments,
                              )}{" "}
                              از {bill.totalInstallments}
                            </>
                          )}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-bold">
                        {formatMoney(bill.amount, settings)}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      {!bill.active ? (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {bill.totalInstallments &&
                          (bill.paidInstallments ?? 0) >= bill.totalInstallments
                            ? "تسویه شده"
                            : "غیرفعال"}
                        </span>
                      ) : paidThisPeriod ? (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          پرداخت شده
                        </span>
                      ) : due ? (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-600 dark:bg-rose-950/40">
                          سررسید شده
                        </span>
                      ) : remaining <= 3 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/40">
                          {remaining} روز مانده
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {remaining} روز مانده
                        </span>
                      )}

                      <div className="flex items-center gap-1">
                        {due && (
                          <Button
                            size="sm"
                            className="rounded-lg text-xs!"
                            onClick={() => pay(bill)}
                          >
                            پرداخت شد
                          </Button>
                        )}
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setEditor({ bill })}
                          aria-label="ویرایش"
                        >
                          <Edit3 />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setDeleteTarget(bill)}
                          aria-label="حذف"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}

          {!sorted.length && (
            <Card className="flex flex-col items-center border-dashed px-6 py-12 text-center shadow-none">
              <div className="mb-4 rounded-2xl bg-primary/10 p-4 text-primary">
                <Bell />
              </div>
              <h2 className="font-bold">هنوز قبض یا قسطی ثبت نشده</h2>
              <p className="mt-2 max-w-[260px] text-sm leading-6 text-muted-foreground">
                قبض‌ها و اقساط ثابت ماهانه (مثل اجاره، برق، وام) را اضافه کنید
                تا هر ماه یادتان بیاید.
              </p>
              <Button className="mt-5 rounded-md" onClick={() => setEditor({})}>
                <Plus data-icon="inline-start" /> افزودن اولین قبض
              </Button>
            </Card>
          )}
        </div>
      </div>

      <RecurringBillEditor
        open={!!editor}
        bill={editor?.bill}
        categories={expenseCategories}
        onClose={() => setEditor(null)}
        onSaved={onRefresh}
      />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف قبض</DialogTitle>
            <DialogDescription>
              {deleteTarget?.title} حذف شود؟
            </DialogDescription>
          </DialogHeader>
          <div className="mt-5 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeleteTarget(null)}
            >
              انصراف
            </Button>
            <Button variant="destructive" className="flex-1" onClick={remove}>
              حذف
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RecurringBillEditor({
  open,
  bill,
  categories,
  onClose,
  onSaved,
}: {
  open: boolean;
  bill?: RecurringBill;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [dueDay, setDueDay] = useState("1");
  const [note, setNote] = useState("");
  const [active, setActive] = useState(true);
  const [isLoan, setIsLoan] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState("");
  const [paidInstallments, setPaidInstallments] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setTitle(bill?.title ?? "");
    setAmount(bill ? String(bill.amount) : "");
    setCategoryId(bill?.categoryId ?? categories[0]?.id ?? "");
    setDueDay(bill ? String(bill.dueDay) : "1");
    setNote(bill?.note ?? "");
    setActive(bill?.active ?? true);
    setIsLoan(!!bill?.totalInstallments);
    setTotalInstallments(
      bill?.totalInstallments ? String(bill.totalInstallments) : "",
    );
    setPaidInstallments(
      bill?.paidInstallments ? String(bill.paidInstallments) : "0",
    );
    setError("");
  }, [bill, open, categories]);

  const save = async () => {
    const cleanTitle = title.trim();
    const value = Number(amount.replace(/\D/g, ""));
    const day = Math.min(31, Math.max(1, Number(dueDay) || 1));

    if (!cleanTitle || !value || !categoryId) {
      setError("عنوان، مبلغ و دسته‌بندی را کامل کنید.");
      return;
    }

    const total = isLoan ? Number(totalInstallments) || 0 : undefined;
    const paid = isLoan ? Number(paidInstallments) || 0 : undefined;

    if (isLoan && (!total || total < 1)) {
      setError("تعداد کل اقساط را وارد کنید.");
      return;
    }
    if (isLoan && paid !== undefined && total !== undefined && paid > total) {
      setError("تعداد اقساط پرداخت‌شده نمی‌تواند از کل اقساط بیشتر باشد.");
      return;
    }

    await saveRecurringBill(
      {
        title: cleanTitle,
        amount: value,
        categoryId,
        dueDay: day,
        note: note.trim(),
        active,
        totalInstallments: total,
        paidInstallments: paid,
      },
      bill,
    );

    await onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bill ? "ویرایش قبض" : "قبض یا قسط جدید"}</DialogTitle>
          <DialogDescription>
            هر ماه در روز مشخص‌شده، در داشبورد یادآوری می‌شود.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">عنوان</label>
            <Input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً قبض برق"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">مبلغ</label>
            <Input
              inputMode="numeric"
              value={
                amount
                  ? Number(amount.replace(/\D/g, "")).toLocaleString("en-US")
                  : ""
              }
              onChange={(e) => setAmount(e.target.value)}
              placeholder="مثلاً ۵۰۰۰۰۰"
              className="h-12 text-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium">
                دسته‌بندی
              </label>
              <Select
                value={categoryId}
                onValueChange={setCategoryId}
                options={categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                  icon: categoryIconMap[c.icon] || Package,
                }))}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">
                روز سررسید
              </label>
              <Input
                inputMode="numeric"
                value={dueDay}
                onChange={(e) =>
                  setDueDay(e.target.value.replace(/\D/g, "").slice(0, 2))
                }
                placeholder="۱ تا ۳۱"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">یادداشت</label>
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اختیاری"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium">
                این یک وام یا قسط با تعداد مشخص است
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                مثلاً وام ۲۴ قسطی
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsLoan((v) => !v)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                isLoan ? "bg-primary" : "bg-muted-foreground/30",
              )}
              aria-label="فعال/غیرفعال کردن حالت وام"
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
                  isLoan ? "right-0.5" : "right-5.5",
                )}
              />
            </button>
          </div>

          {isLoan && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  تعداد کل اقساط
                </label>
                <Input
                  inputMode="numeric"
                  value={totalInstallments}
                  onChange={(e) =>
                    setTotalInstallments(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="مثلاً ۲۴"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">
                  تعداد پرداخت‌شده
                </label>
                <Input
                  inputMode="numeric"
                  value={paidInstallments}
                  onChange={(e) =>
                    setPaidInstallments(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="۰"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-3">
            <div>
              <p className="text-sm font-medium">وضعیت قبض</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {active
                  ? "قبض فعال است و در موعد سررسید یادآوری می‌شود."
                  : "قبض غیرفعال است و یادآوری نمی‌شود."}
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={active}
              onClick={() => setActive((v) => !v)}
              className={cn(
                "relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200",
                active ? "bg-primary" : "bg-muted-foreground/30",
              )}
              aria-label="فعال یا غیرفعال کردن قبض"
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all duration-200",
                  active ? "right-0.5" : "right-5.5",
                )}
              />
            </button>
          </div>

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button className="w-full" onClick={save} disabled={!title.trim()}>
            {bill ? "ذخیره تغییرات" : "افزودن قبض"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

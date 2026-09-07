"use client";

import * as React from "react";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

const Ctx = React.createContext<{
  open: boolean;
  setOpen: (v: boolean) => void;
}>({ open: false, setOpen: () => {} });
export function Dialog({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  children: React.ReactNode;
}) {
  const [inner, setInner] = React.useState(false);
  const open = controlledOpen ?? inner;
  const setOpen = (v: boolean) => {
    inner !== v && setInner(v);
    onOpenChange?.(v);
  };
  return <Ctx.Provider value={{ open, setOpen }}>{children}</Ctx.Provider>;
}
export function DialogTrigger({
  children,
  asChild = false,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { setOpen } = React.useContext(Ctx);
  if (asChild && React.isValidElement(children))
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: any) => {
        children.props.onClick?.(e);
        if (!e.defaultPrevented) setOpen(true);
      },
    });
  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}
export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open, setOpen } = React.useContext(Ctx);
  React.useEffect(() => {
    if (!open) return;
    const f = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", f);
    return () => document.removeEventListener("keydown", f);
  }, [open]);
  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "max-h-[92dvh] w-full max-w-[430px] overflow-y-auto rounded-lg rounded-b-none border bg-white p-5 shadow-2xl absolute bottom-0",
          className,
        )}
      >
        {children}
        <button
          type="button"
          aria-label="بستن"
          onClick={() => setOpen(false)}
          className="absolute left-4 top-4 inline-flex size-8 items-center justify-center rounded-lg hover:bg-muted"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>,
    document.body,
  );
}
export function DialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div className={cn("mb-5 pr-2", className)} {...props} />;
}
export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return <h2 className={cn("text-lg font-bold", className)} {...props} />;
}
export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn("mt-1 text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

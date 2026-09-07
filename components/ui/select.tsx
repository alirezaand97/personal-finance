"use client";

import * as React from "react";

import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";

type Option = {
  value: string;
  label: string;
  icon?: React.ElementType;
};

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "انتخاب کنید",
  className,
}: {
  value: string;
  onValueChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const ref = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const [position, setPosition] = React.useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const selected = options.find((o) => o.value === value);

  const updatePosition = React.useCallback(() => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    setPosition({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  // Update position while dropdown is open
  React.useEffect(() => {
    if (!open) return;

    updatePosition();

    const handleScroll = () => {
      updatePosition();
    };

    const handleResize = () => {
      updatePosition();
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [open, updatePosition]);

  // Click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      const clickedTrigger = ref.current?.contains(target);
      const clickedDropdown = dropdownRef.current?.contains(target);

      if (!clickedTrigger && !clickedDropdown) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => {
          updatePosition();
          setOpen((v) => !v);
        }}
        className={cn(
          "flex h-10 w-full items-center gap-2 rounded-md",
          "border border-border bg-white px-3 text-sm!",
          "transition-colors hover:bg-muted",
          open && "ring-2 ring-primary/20",
        )}
        aria-expanded={open}
      >
        <span className="flex-1 text-start">
          {selected?.label ?? placeholder}
        </span>

        <ChevronDown
          className={cn(
            "size-4 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] max-h-56 overflow-auto rounded-xl border border-border bg-white p-1.5 shadow-xl"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
            }}
          >
            {options.map((o) => {
              const Icon = o.icon;
              const isSelected = o.value === value;

              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onValueChange(o.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg",
                    "px-3 py-2 text-sm!",
                    "transition-colors",
                    "hover:bg-muted",
                    isSelected &&
                      "bg-primary/10 text-primary",
                  )}
                >
                  {Icon && <Icon className="size-4 shrink-0" />}

                  <span className="flex-1 text-start">
                    {o.label}
                  </span>

                  {isSelected && (
                    <Check className="size-4 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
}
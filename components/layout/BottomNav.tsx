"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeftRight, BarChart3, Home, Plus, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { NavItem } from "./NavItem";

export function BottomNav() {
  const pathname = usePathname();
  const active = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-[430px] items-end justify-around bg-white px-3 pb-[max(.65rem,env(safe-area-inset-bottom))] pt-2 shadow-2xl backdrop-blur dark:bg-background">
      <NavItem active={active("/dashboard")} icon={<Home />} label="خانه" href="/dashboard" />
      <NavItem active={active("/transactions")} icon={<ArrowLeftRight />} label="تراکنش‌ها" href="/transactions" />
      <Button asChild aria-label="ثبت تراکنش" size="icon-lg" className="-mt-10 h-10 w-10 rounded-full">
        <Link href="/transactions/new"><Plus /></Link>
      </Button>
      <NavItem active={active("/analytics")} icon={<BarChart3 />} label="تحلیل" href="/analytics" />
      <NavItem active={active("/categories")} icon={<Tags />} label="دسته‌ها" href="/categories" />
    </nav>
  );
}

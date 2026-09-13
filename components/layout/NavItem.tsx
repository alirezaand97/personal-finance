import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NavItem({ active, icon, label, href }: { active: boolean; icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link href={href} className={cn("flex min-w-16 flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] transition-colors", active ? "text-foreground" : "text-muted-foreground hover:text-foreground")}>
      <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

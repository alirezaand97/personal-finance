import * as React from "react"
import { cn } from "@/lib/utils"
type BadgeProps=React.ComponentProps<"span">&{variant?: "default"|"outline"|"secondary"|"destructive"}
export function Badge({className,variant="default",...props}:BadgeProps){return <span data-slot="badge" className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",variant==="default"&&"border-transparent bg-primary text-primary-foreground",variant==="outline"&&"bg-background",variant==="secondary"&&"bg-secondary text-secondary-foreground",variant==="destructive"&&"border-transparent bg-destructive/10 text-destructive",className)} {...props}/>}

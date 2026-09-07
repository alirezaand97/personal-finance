import * as React from "react"
import { cn } from "@/lib/utils"
export function Separator({className,orientation="horizontal",...props}:{className?:string;orientation?: "horizontal"|"vertical"} & React.ComponentProps<"div">){return <div role="separator" data-slot="separator" aria-orientation={orientation} className={cn(orientation==="horizontal"?"h-px w-full":"h-full w-px", "shrink-0 bg-border",className)} {...props}/>} 

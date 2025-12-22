"use client"

import * as React from "react"
import type * as LabelPrimitive from "@radix-ui/react-label"
// We don't have radix installed in this environment description, likely, but I'll make a simple one to avoid dependency issues if possible, or assume shadcn pattern.
// Actually, let's make a simple HTML label wrapper to be safe as I can't easily install packages.
import { cn } from "@/lib/utils"

const Label = React.forwardRef<
    HTMLLabelElement,
    React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
    <label
        ref={ref}
        className={cn(
            "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
            className
        )}
        {...props}
    />
))
Label.displayName = "Label"

export { Label }

"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Dialog = ({ open, onOpenChange, children }: { open?: boolean; onOpenChange?: (open: boolean) => void; children: React.ReactNode }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto p-4">
            <div className="absolute inset-0" onClick={() => onOpenChange?.(false)} />
            {children}
        </div>
    );
};

const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("relative z-50 w-full max-w-lg rounded-lg bg-(--bg-card) p-6 shadow-lg border border-(--border)", className)}>
        {children}
    </div>
);

const DialogHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}>
        {children}
    </div>
);

const DialogTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
        {children}
    </h2>
);

export { Dialog, DialogContent, DialogHeader, DialogTitle };

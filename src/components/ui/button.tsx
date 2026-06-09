"use client";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?:  boolean;
  variant?:  "primary" | "outline" | "ghost" | "danger";
  fullWidth?: boolean;
  icon?:     React.ReactNode;
}

export function Btn({
  children, loading, variant = "primary",
  fullWidth, icon, className, disabled, ...props
}: BtnProps) {
  const base = "inline-flex items-center justify-center gap-2 font-bold rounded-xl transition-all duration-200 py-3 px-4 text-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed";

  const variants = {
    primary: "grad text-white shadow-lg shadow-purple-200/50 hover:opacity-90",
    outline: "bg-white border-2 border-purple-200 text-purple-600 hover:bg-purple-50",
    ghost:   "bg-gray-100 text-gray-700 hover:bg-gray-200",
    danger:  "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100",
  };

  return (
    <button
      disabled={disabled || loading}
      className={cn(base, variants[variant], fullWidth && "w-full", className)}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : icon}
      {children}
    </button>
  );
}
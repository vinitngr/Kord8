import * as React from "react";
import { cn } from "../../lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "error";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[#111] text-white",
    secondary: "bg-[#F5F5F5] text-[#666]",
    outline: "border border-[#E5E5E5] text-[#666]",
    success: "bg-[#E6F6EB] text-[#008A2E] border border-[#B3E5C4]",
    warning: "bg-[#FFF9E6] text-[#8A6D00] border border-[#FFE5B3]",
    error: "bg-[#FEEBEB] text-[#E60000] border border-[#FFCCCC]",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors focus:outline-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };

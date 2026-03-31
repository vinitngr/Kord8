import * as React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-[#111] text-white hover:bg-[#333] active:scale-[0.98]",
      secondary: "bg-[#FAFAFA] text-[#111] border border-[#E5E5E5] hover:bg-[#F0F0F0] active:scale-[0.98]",
      outline: "bg-transparent text-[#111] border border-[#E5E5E5] hover:bg-[#FAFAFA] active:scale-[0.98]",
      ghost: "bg-transparent text-[#666] hover:bg-[#FAFAFA] hover:text-[#111]",
      destructive: "bg-[#FF0000] text-white hover:bg-[#CC0000] active:scale-[0.98]",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
      icon: "h-10 w-10 p-0 flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-all focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };

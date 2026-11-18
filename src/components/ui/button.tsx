import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-[#2563EB] text-white hover:bg-[#1D4ED8]",
        navy: "bg-[#101F35] text-white hover:bg-[#172B4D]",
        outline:
          "border border-[#E2E8F0] bg-white text-[#172B4D] hover:bg-slate-50",
        ghost: "text-[#64748B] hover:bg-slate-100 hover:text-[#172B4D]",
        destructive: "bg-[#DC2626] text-white hover:bg-red-700",
        success: "bg-[#16A34A] text-white hover:bg-green-700",
        amber: "bg-[#F59E0B] text-[#101F35] hover:bg-amber-400",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-11 px-5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
);
Button.displayName = "Button";

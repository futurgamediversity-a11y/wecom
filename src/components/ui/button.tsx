import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Button ported from the Flutter login screen primitives:
 * - `primary`: solid orange (FF8200), white text, 4px radius (matches login button)
 * - `secondary`: outlined green (009639), green text  (matches "Créer un compte")
 * - `ghost`: transparent, hover surface
 * - `outline`: neutral border
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wcom-orange/40 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-wcom-orange text-white hover:bg-wcom-orange/90",
        secondary:
          "border border-wcom-green text-wcom-green bg-transparent hover:bg-wcom-green/5",
        outline:
          "border border-neutral-300 text-neutral-800 bg-white hover:bg-neutral-50",
        ghost: "text-neutral-700 hover:bg-neutral-100",
        dark: "bg-wcom-dark text-white hover:bg-wcom-dark/90",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-12 px-5 text-base",
        lg: "h-14 px-6 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

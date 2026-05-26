import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Outlined input matching the Flutter `_inputDeco` helper:
 * - 4px radius, neutral-300 border, focused border = primary orange,
 *   16px vertical padding, optional leading icon.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leadingIcon, ...props }, ref) => {
    return (
      <div className="relative">
        {leadingIcon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">
            {leadingIcon}
          </span>
        ) : null}
        <input
          ref={ref}
          className={cn(
            "h-12 w-full rounded-sm border border-neutral-300 bg-white px-4 text-sm placeholder:text-neutral-400",
            "focus:border-wcom-orange focus:outline-none focus:ring-2 focus:ring-wcom-orange/20",
            leadingIcon ? "pl-10" : "",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

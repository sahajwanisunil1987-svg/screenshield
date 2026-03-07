import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200",
        variant === "primary" && "bg-accent text-white hover:bg-teal-700",
        variant === "secondary" && "bg-ink text-white hover:bg-slate-900",
        variant === "ghost" && "bg-white/10 text-white hover:bg-white/20",
        className
      )}
      {...props}
    />
  );
}

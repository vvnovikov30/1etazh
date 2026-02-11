import type { ElementType, ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary";

type ButtonProps<C extends ElementType> = {
  as?: C;
  variant?: Variant;
  className?: string;
} & Omit<ComponentPropsWithoutRef<C>, "as" | "className">;

const baseClasses =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-btn)] px-5 py-3 text-sm font-medium transition duration-200 no-underline hover:no-underline focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]";

const variants: Record<Variant, string> = {
  primary: "bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-90",
  secondary: "border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-light)]",
};

export function Button<C extends ElementType = "button">({
  as,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps<C>) {
  const Component = (as ?? "button") as ElementType;
  return <Component className={`${baseClasses} ${variants[variant]} ${className}`} {...props} />;
}

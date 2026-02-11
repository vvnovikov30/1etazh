import type { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

export function Input({ className = "", ...props }: Props) {
  return (
    <input
      className={`h-14 w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 text-[16px] placeholder:text-[var(--color-text)] placeholder:opacity-70 focus-visible:border-[var(--color-primary)] ${className}`}
      {...props}
    />
  );
}

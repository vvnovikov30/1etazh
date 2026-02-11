import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Badge({ children, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-bg-light)] px-3 py-1 text-xs text-[var(--color-text)]/80 ${className}`}
    >
      {children}
    </span>
  );
}

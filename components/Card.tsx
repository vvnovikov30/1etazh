import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: Props) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 shadow-[var(--shadow-card)] transition duration-200 hover:shadow-[var(--shadow-card-hover)] ${className}`}
    >
      {children}
    </div>
  );
}

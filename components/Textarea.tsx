import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
};

export function Textarea({ className = "", ...props }: Props) {
  return (
    <textarea
      className={`min-h-[140px] w-full rounded-[var(--radius-btn)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-[16px] placeholder:text-[var(--color-text)] placeholder:opacity-70 focus-visible:border-[var(--color-primary)] ${className}`}
      {...props}
    />
  );
}

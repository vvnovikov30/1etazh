import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Container({ children, className = "" }: Props) {
  return (
    <div className={`mx-auto w-full max-w-[var(--container-max)] px-4 md:px-6 ${className}`}>
      {children}
    </div>
  );
}

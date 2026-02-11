import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Section({ children, className = "" }: Props) {
  return <section className={`py-12 md:py-16 lg:py-24 ${className}`}>{children}</section>;
}

import type { ReactNode } from "react";
import type { ComponentPropsWithoutRef } from "react";

type Props = ComponentPropsWithoutRef<"section"> & {
  children: ReactNode;
  className?: string;
};

export function Section({ children, className = "", ...rest }: Props) {
  return (
    <section className={`py-12 md:py-16 lg:py-24 ${className}`} {...rest}>
      {children}
    </section>
  );
}

import { Card } from "@/components/Card";

export type FAQItem = {
  question: string;
  answer: string;
};

type MiniFAQProps = {
  items: FAQItem[];
  className?: string;
};

export function MiniFAQ({ items, className = "" }: MiniFAQProps) {
  if (items.length === 0) return null;

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {items.map((item, index) => (
        <Card key={index} className="p-5">
          <h3 className="text-base font-semibold text-[var(--color-text)]">{item.question}</h3>
          <p className="mt-2 text-sm text-[var(--color-text)]/80">{item.answer}</p>
        </Card>
      ))}
    </div>
  );
}

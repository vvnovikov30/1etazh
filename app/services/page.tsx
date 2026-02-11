import Link from "next/link";
import { services } from "@/lib/services";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";

export default function ServicesPage() {
  const highlights: Record<string, string[]> = {
    "stroitelstvo-domov": ["Смета и график", "Контроль качества", "Гарантия"],
    proektirovanie: ["Планировки", "Инженерные решения", "Документация"],
    "setki-garmoshka": ["Замер проёмов", "Подбор полотен", "Монтаж"],
    "myagkie-okna-pvh": ["Замер", "Изготовление", "Монтаж"],
    "teplovizionnoe-obsledovanie": ["Диагностика", "Отчёт", "Рекомендации"],
  };

  return (
    <main>
      <Section>
        <Container>
          <div className="max-w-2xl">
            <h1>Услуги</h1>
            <p className="mt-3 text-[var(--color-text)]/80">
              Проектирование, строительство и доп. работы по дому. Короткий бриф и расчёт.
            </p>
            <div className="mt-6">
              <Button as={Link} href="/contacts">
                Запросить расчёт
              </Button>
            </div>
          </div>
        </Container>
      </Section>

      <Section className="bg-[var(--color-bg-light)]">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            {services.map((s) => (
              <Card key={s.slug} className="flex h-full flex-col justify-between p-6">
                <div>
                  <div className="text-xs uppercase tracking-wide text-[var(--color-text)]/60">{s.category}</div>
                  <div className="mt-2 text-lg font-semibold text-[var(--color-text)]">{s.title}</div>
                  <p className="mt-2 text-sm text-[var(--color-text)]/80">{s.description}</p>
                  <ul className="mt-4 space-y-2 text-sm text-[var(--color-text)]/80">
                    {(highlights[s.slug] ?? ["Консультация", "Смета", "Сроки"]).map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <Button as={Link} href={`/services/${s.slug}`} variant="secondary">
                    Подробнее
                  </Button>
                  <Button as={Link} href="/contacts">
                    Запросить расчёт
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}

import { LINKS } from "@/lib/links";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { LeadForm } from "@/components/LeadForm";
import { JsonLd } from "@/components/JsonLd";
import { contactPageJsonLd } from "@/lib/seo";

export default function ContactsPage() {
  return (
    <main>
      <JsonLd data={contactPageJsonLd()} />
      <Section>
        <Container>
          <div className="max-w-2xl">
            <h1>Контакты</h1>
            <p className="mt-3 text-[var(--color-text)]/80">
              Быстрее всего — написать в Telegram: пришлите участок/планировку/вопрос, ответим по делу.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="bg-[var(--color-bg-light)]">
        <Container className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6">
            <div className="text-xs uppercase tracking-wide text-[var(--color-text)]/60">Контакты</div>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <div className="text-[var(--color-text)]/70">Телефон</div>
                <a className="mt-2 block text-lg text-[var(--color-text)]" href={LINKS.tel}>
                  {LINKS.phoneDisplay}
                </a>
              </div>
              <div>
                <div className="text-[var(--color-text)]/70">Email</div>
                <a className="mt-2 block text-[var(--color-text)]" href={`mailto:${LINKS.email}`}>
                  {LINKS.email}
                </a>
              </div>
              <div>
                <div className="text-[var(--color-text)]/70">Telegram</div>
                <a className="mt-2 block text-[var(--color-text)]" href={LINKS.telegramChat} target="_blank" rel="noopener noreferrer">
                  {LINKS.telegramChat}
                </a>
              </div>
              <div>
                <div className="text-[var(--color-text)]/70">Канал</div>
                <a className="mt-2 block text-[var(--color-text)]" href={LINKS.telegramChannel} target="_blank" rel="noopener noreferrer">
                  {LINKS.telegramChannel}
                </a>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-xs uppercase tracking-wide text-[var(--color-text)]/60">
              Форма заявки
            </div>
            <LeadForm />
          </Card>
        </Container>
      </Section>

      <Section>
        <Container className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-6">
            <div className="text-xs uppercase tracking-wide text-[var(--color-text)]/60">
              Что прислать, чтобы мы дали точный ответ
            </div>
            <ul className="mt-4 space-y-2 text-sm text-[var(--color-text)]/80">
              <li>Локация / район (гео)</li>
              <li>Площадь и назначение дома</li>
              <li>Если есть — план/эскиз, фото участка</li>
              <li>Бюджет и желаемые сроки</li>
            </ul>
          </Card>

          <div className="h-[320px] w-full rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-bg-light)]">
            <div className="flex h-full items-center justify-center text-sm text-[var(--color-text)]/70">
              Карта (заглушка)
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}

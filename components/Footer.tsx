import Link from "next/link";
import { LINKS } from "@/lib/links";
import { Container } from "@/components/Container";

export function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)]">
      <Container className="py-10 text-sm">
        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr_1fr] md:items-start">
          <div>
            <div className="text-base font-semibold text-[var(--color-text)]">Одноэтажники.РФ</div>
            <div className="mt-2 text-[var(--color-text)]/70">
              Проекты и строительство одноэтажных домов. Консультации и расчёты под участок.
            </div>
            <div className="mt-4 text-[var(--color-text)]/70">© {new Date().getFullYear()}</div>
          </div>

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-[var(--color-text)]/60">Навигация</div>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-[var(--color-text)]">Главная</Link>
              <Link href="/services" className="text-[var(--color-text)]">Услуги</Link>
              <Link href="/blog" className="text-[var(--color-text)]">Блог</Link>
              <Link href="/contacts" className="text-[var(--color-text)]">Контакты</Link>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs uppercase tracking-wide text-[var(--color-text)]/60">Контакты</div>
            <div className="flex flex-col gap-2">
              <a href={LINKS.tel} className="text-[var(--color-text)]">{LINKS.phoneDisplay}</a>
              <a href={`mailto:${LINKS.email}`} className="text-[var(--color-text)]">
                {LINKS.email}
              </a>
              <a href={LINKS.telegramChat} target="_blank" rel="noopener noreferrer">
                Написать в Telegram
              </a>
              <a href={LINKS.telegramChannel} target="_blank" rel="noopener noreferrer">
                Подписаться на канал
              </a>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}

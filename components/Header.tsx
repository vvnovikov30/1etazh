import Image from "next/image";
import Link from "next/link";
import { LINKS } from "@/lib/links";
import { Container } from "@/components/Container";
import { Button } from "@/components/Button";

export function Header() {
  return (
    <header className="fixed left-0 top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4 md:h-20">
        <Link href="/" className="flex items-center gap-3" aria-label="Одноэтажники.РФ">
          <Image
            src="/logo.png"
            alt="Одноэтажники.РФ"
            width={180}
            height={48}
            priority
            className="h-18 w-auto md:h-24"
          />
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/" className="text-[var(--color-text)]">
            Главная
          </Link>
          <Link href="/services" className="text-[var(--color-text)]">
            Услуги
          </Link>
          <Link href="/blog" className="text-[var(--color-text)]">
            Блог
          </Link>
          <Link href="/contacts" className="text-[var(--color-text)]">
            Контакты
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button as="a" href={LINKS.tel} variant="secondary" className="hidden md:inline-flex">
            {LINKS.phoneDisplay}
          </Button>
          <Button
            as="a"
            href={LINKS.telegramChat}
            target="_blank"
            rel="noopener noreferrer"
            variant="secondary"
          >
            Telegram
          </Button>
        </div>
      </Container>
    </header>
  );
}

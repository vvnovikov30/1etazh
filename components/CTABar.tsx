import Link from "next/link";
import { LINKS } from "@/lib/links";
import { Button } from "@/components/Button";

type Props = {
  primaryText?: string;
  showSubscribe?: boolean;
};

export function CTABar({ primaryText = "Получить расчёт", showSubscribe = true }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button as={Link} href="/contacts">
        {primaryText}
      </Button>

      <Button
        as="a"
        href={LINKS.telegramChat}
        target="_blank"
        rel="noopener noreferrer"
        variant="secondary"
      >
        Написать в Telegram
      </Button>

      {showSubscribe && (
        <Button
          as="a"
          href={LINKS.telegramChannel}
          target="_blank"
          rel="noopener noreferrer"
          variant="secondary"
        >
          Подписаться на канал
        </Button>
      )}
    </div>
  );
}

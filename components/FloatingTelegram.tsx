"use client";

import { LINKS } from "@/lib/links";
import { Button } from "@/components/Button";

export function FloatingTelegram() {
  return (
    <Button
      as="a"
      href={LINKS.telegramChat}
      target="_blank"
      rel="noopener noreferrer"
      variant="secondary"
      className="fixed bottom-4 right-4 z-50 md:hidden"
      aria-label="Написать в Telegram"
    >
      Написать в Telegram
    </Button>
  );
}

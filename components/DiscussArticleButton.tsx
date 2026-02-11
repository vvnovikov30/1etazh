"use client";

import { MouseEvent } from "react";
import { Button } from "@/components/Button";

type Props = {
  slug: string;
  title: string;
  telegramUrl: string;
};

export function DiscussArticleButton({ slug, title, telegramUrl }: Props) {
  async function onClick() {
    try {
      await fetch("/api/telegram/discussion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slug,
          title,
          url: typeof window !== "undefined" ? window.location.href : "",
        }),
        keepalive: true,
      });
    } catch {
      // Intentionally ignore errors to avoid blocking the Telegram redirect.
    }
  }

  function handleMouseDown(event: MouseEvent<HTMLAnchorElement>) {
    // Start the request before the browser opens Telegram in a new tab.
    if (event.button === 0) {
      void onClick();
    }
  }

  return (
    <Button
      as="a"
      href={telegramUrl}
      target="_blank"
      rel="noopener noreferrer"
      variant="secondary"
      onMouseDown={handleMouseDown}
    >
      Обсудить статью в Telegram
    </Button>
  );
}

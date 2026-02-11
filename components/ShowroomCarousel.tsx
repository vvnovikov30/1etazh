"use client";
import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/Card";
import { Carousel } from "@/components/Carousel";
import { Button } from "@/components/Button";
import type { ShowroomSlide } from "@/lib/showroom";

function getTelegramLeadsUrl(): string {
  // Используем NEXT_PUBLIC_ переменную, которая доступна на клиенте
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_LEADS_BOT_USERNAME;
  if (botUsername) {
    return `https://t.me/${botUsername}?start=showroom_visit`;
  }
  // Fallback на общий Telegram (из lib/links.ts)
  return "https://t.me/lesnye_polyany";
}

export function ShowroomCarousel({ slides }: { slides: ShowroomSlide[] }) {
  if (slides.length === 0) return null;

  return (
    <div>
      <Carousel
        items={slides}
        renderItem={(slide) => (
          <Card className="group w-full max-w-[400px] overflow-hidden p-0">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 400px"
              />
            </div>
            <div className="p-4">
              {slide.caption && (
                <p className="text-sm text-[var(--color-text)]/80">{slide.caption}</p>
              )}
              {slide.blogSlug && (
                <Link
                  href={`/blog/${slide.blogSlug}`}
                  className="mt-2 inline-block text-xs text-[var(--color-text)]/70 transition-colors hover:text-[var(--color-text)]"
                  aria-label={`Подробнее о ${slide.caption || "этом решении"}`}
                >
                  Подробнее →
                </Link>
              )}
            </div>
          </Card>
        )}
        itemClassName="w-full max-w-[400px]"
        autoScroll={true}
        autoScrollInterval={7000}
        showArrows={true}
        showProgress={true}
        ariaLabel="Карусель шоурума"
        infinite={true}
        shuffleSeedKey="showroomCarouselSeed"
        enable3D={true}
      />
      <div className="mt-6">
        <Button
          as="a"
          href={getTelegramLeadsUrl()}
          target="_blank"
          rel="noopener noreferrer"
        >
          Записаться на просмотр
        </Button>
        <p className="mt-2 text-sm text-[var(--color-text)]/70">
          Запись на просмотр шоурума, дата, время
        </p>
      </div>
    </div>
  );
}

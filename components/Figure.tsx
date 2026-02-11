import Image from "next/image";

// Шаблоны alt/caption по категориям (те же, что в генераторе)
const CATEGORY_TEMPLATES: Record<string, { alt: string; caption: string }> = {
  exterior: {
    alt: "Шоурум одноэтажного дома: фасад и внешний вид",
    caption: "Фасад и внешний вид",
  },
  interior: {
    alt: "Шоурум одноэтажного дома: интерьер и планировка",
    caption: "Интерьер шоурума",
  },
  kitchen: {
    alt: "Шоурум одноэтажного дома: кухня-гостиная",
    caption: "Кухня-гостиная",
  },
  bathroom: {
    alt: "Шоурум одноэтажного дома: санузел и душ",
    caption: "Санузел и душ",
  },
  bedroom: {
    alt: "Шоурум одноэтажного дома: спальня",
    caption: "Спальня",
  },
  engineering: {
    alt: "Шоурум одноэтажного дома: инженерия и котельная",
    caption: "Инженерия и котельная",
  },
  plan: {
    alt: "Шоурум одноэтажного дома: планировка",
    caption: "Планировка",
  },
  landscape: {
    alt: "Шоурум одноэтажного дома: участок и окружение",
    caption: "Участок и окружение",
  },
  misc: {
    alt: "Шоурум одноэтажного дома: детали и дополнительные фото",
    caption: "Дополнительные фото",
  },
};

function getCategoryFromPath(src: string): string | null {
  // Извлекаем категорию из пути /showroom/<category>/...
  const match = src.match(/\/showroom\/([^/]+)\//);
  return match ? match[1] : null;
}

export type FigureProps = {
  src: string;
  alt?: string;
  caption?: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
};

export function Figure({ src, alt, caption, className, width, height, fill, sizes }: FigureProps) {
  // Если alt/caption не переданы и src начинается с "/showroom/", определяем категорию
  let finalAlt = alt;
  let finalCaption = caption;

  if ((!alt || !caption) && src.startsWith("/showroom/")) {
    const category = getCategoryFromPath(src);
    if (category && CATEGORY_TEMPLATES[category]) {
      const template = CATEGORY_TEMPLATES[category];
      finalAlt = alt || template.alt;
      finalCaption = caption || template.caption;
    }
  }

  // Если alt всё ещё не задан, используем caption или базовое значение
  if (!finalAlt) {
    finalAlt = finalCaption || "Изображение";
  }

  return (
    <figure className={className}>
      <div className="relative w-full">
        {fill ? (
          <Image
            src={src}
            alt={finalAlt}
            fill
            className="object-cover"
            sizes={sizes || "(max-width: 768px) 100vw, 800px"}
          />
        ) : (
          <Image
            src={src}
            alt={finalAlt}
            width={width || 800}
            height={height || 600}
            className="w-full h-auto"
            sizes={sizes || "(max-width: 768px) 100vw, 800px"}
          />
        )}
      </div>
      {finalCaption && (
        <figcaption className="mt-2 text-sm text-[var(--color-text)]/80">{finalCaption}</figcaption>
      )}
    </figure>
  );
}

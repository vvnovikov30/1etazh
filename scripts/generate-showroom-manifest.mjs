import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHOWROOM_DIR = path.join(__dirname, "..", "public", "showroom");
const OUTPUT_FILE = path.join(__dirname, "..", "lib", "showroom.generated.ts");
const OVERRIDES_FILE = path.join(__dirname, "..", "content", "showroom.overrides.json");

// Категории шоурума
const CATEGORIES = [
  "exterior",
  "interior",
  "kitchen",
  "bathroom",
  "bedroom",
  "engineering",
  "plan",
  "landscape",
  "misc",
];

// Словарь тегов-фич с описаниями
const FEATURE_COPY = {
  ventilation: {
    title: "Вентиляция",
    benefit: "комфортный воздухообмен без духоты",
  },
  recuperation: {
    title: "Рекуперация",
    benefit: "свежий воздух без потерь тепла",
  },
  "fresh-air": {
    title: "Свежий воздух",
    benefit: "постоянный приток свежего воздуха",
  },
  foundation: {
    title: "Фундамент",
    benefit: "стабильное основание без промерзания",
  },
  slab: {
    title: "Плита",
    benefit: "монолитная плита с утеплением",
  },
  waterproofing: {
    title: "Гидроизоляция",
    benefit: "защита от влаги и грунтовых вод",
  },
  insulation: {
    title: "Утепление",
    benefit: "эффективная теплоизоляция стен и перекрытий",
  },
  "thermal-bridge": {
    title: "Мостики холода",
    benefit: "исключаем продувания и теплопотери",
  },
  "energy-saving": {
    title: "Энергосбережение",
    benefit: "низкие затраты на отопление и кондиционирование",
  },
};

// Маппинг категорий на человекочитаемые названия
const CATEGORY_HUMAN_NAMES = {
  exterior: "фасад",
  interior: "интерьер",
  kitchen: "кухня-гостиная",
  bathroom: "санузел",
  bedroom: "спальня",
  engineering: "инженерия",
  plan: "планировка",
  landscape: "участок",
  misc: "детали",
};

// Шаблоны alt/caption по категориям
const CATEGORY_TEMPLATES = {
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

// Поддерживаемые форматы изображений
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

function loadOverrides() {
  if (!fs.existsSync(OVERRIDES_FILE)) {
    return {};
  }
  try {
    const content = fs.readFileSync(OVERRIDES_FILE, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Warning: Could not parse ${OVERRIDES_FILE}:`, error.message);
    return {};
  }
}

/**
 * Генерирует alt и caption из тегов
 * @param {string} category - категория слайда
 * @param {string[]} tags - массив тегов
 * @returns {{alt: string, caption: string}} объект с alt и caption
 */
function buildAltCaption(category, tags) {
  // Если тегов нет, возвращаем дефолты по категории
  if (!tags || tags.length === 0) {
    const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.misc;
    return {
      alt: template.alt,
      caption: template.caption,
    };
  }

  // Фильтруем теги, которые есть в FEATURE_COPY
  const validTags = tags.filter((tag) => FEATURE_COPY[tag]);

  // Если нет валидных тегов, возвращаем дефолты
  if (validTags.length === 0) {
    const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.misc;
    return {
      alt: template.alt,
      caption: template.caption,
    };
  }

  // Берем первые 1-2 тега для caption
  const captionTags = validTags.slice(0, 2);
  const captionParts = captionTags.map((tag) => FEATURE_COPY[tag].title);

  // Проверяем, есть ли у тегов кастомный caption
  let caption = null;
  for (const tag of captionTags) {
    if (FEATURE_COPY[tag].caption) {
      caption = FEATURE_COPY[tag].caption;
      break;
    }
  }

  // Если нет кастомного caption, склеиваем titles
  if (!caption) {
    caption = captionParts.join(" • ");
  }

  // Формируем alt
  const humanCategory =
    CATEGORY_HUMAN_NAMES[category] || category;
  const benefitParts = validTags
    .slice(0, 2)
    .map((tag) => FEATURE_COPY[tag].benefit);
  const benefitCombo = benefitParts.join("; ");

  let alt = `Шоурум одноэтажного дома: ${humanCategory} — ${benefitCombo}.`;

  // Ограничиваем длину alt до ~180 символов
  if (alt.length > 180) {
    alt = alt.substring(0, 177) + "...";
  }

  return { alt, caption };
}

function generateShowroomManifest() {
  const slides = [];
  const overrides = loadOverrides();

  // Сканируем каждую категорию
  for (const category of CATEGORIES) {
    const categoryDir = path.join(SHOWROOM_DIR, category);
    
    if (!fs.existsSync(categoryDir)) {
      continue;
    }

    const files = fs.readdirSync(categoryDir).filter(isImageFile);

    for (const file of files) {
      const src = `/showroom/${category}/${file}`;
      const template = CATEGORY_TEMPLATES[category] || CATEGORY_TEMPLATES.misc;
      
      // Применяем overrides если есть
      const override = overrides[src] || {};
      
      // Определяем теги: overrides.tags полностью заменяет дефолтные
      const tags = override.tags || [];
      
      // Приоритет для alt/caption:
      // 1. Если override задаёт alt/caption явно — используем их
      // 2. Иначе если override задаёт tags — строим из tags
      // 3. Иначе — category дефолт
      let alt, caption;
      if (override.alt !== undefined || override.caption !== undefined) {
        // Явно заданы в override
        alt = override.alt || template.alt;
        caption = override.caption || template.caption;
      } else if (tags.length > 0) {
        // Есть теги — генерируем из них
        const generated = buildAltCaption(category, tags);
        alt = generated.alt;
        caption = generated.caption;
      } else {
        // Дефолт по категории
        alt = template.alt;
        caption = template.caption;
      }
      
      const slide = {
        src,
        category,
        alt,
        caption,
        tags,
      };

      // Добавляем blogSlug если задан в override
      if (override.blogSlug) {
        slide.blogSlug = override.blogSlug;
      }

      slides.push(slide);
    }
  }

  // Сортируем по категории и имени файла для предсказуемости
  slides.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.src.localeCompare(b.src);
  });

  // Генерируем TypeScript файл
  const typeDefinition = `export type ShowroomSlide = {
  src: string;
  category: string;
  alt: string;
  caption: string;
  tags: string[];
  blogSlug?: string;
  featureKey?: string;
};`;

  const slidesExport = `export const showroomSlides: ShowroomSlide[] = ${JSON.stringify(slides, null, 2)};`;

  const output = `// This file is auto-generated by scripts/generate-showroom-manifest.mjs
// Do not edit manually. Run "npm run content:gen" to regenerate.

${typeDefinition}

${slidesExport}
`;

  // Создаём директорию lib если её нет
  const libDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, output, "utf8");
  console.log(`✓ Generated ${slides.length} showroom slides in ${OUTPUT_FILE}`);
}

generateShowroomManifest();

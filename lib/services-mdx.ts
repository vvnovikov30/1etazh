import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

export type ServiceMdxMeta = {
  slug: string;
  title: string;
  description: string;
  date?: string;
  tags: string[];
  cover?: string;
  intent?: string;
  readingMinutes: number;
};

const SERVICES_DIR = path.join(process.cwd(), "content", "services");

export function hasServiceMdx(slug: string) {
  return fs.existsSync(path.join(SERVICES_DIR, `${slug}.mdx`));
}

export function getAllServiceMdx(): ServiceMdxMeta[] {
  if (!fs.existsSync(SERVICES_DIR)) return [];

  const files = fs.readdirSync(SERVICES_DIR).filter((f) => f.endsWith(".mdx"));
  const items = files.map((file) => {
    const slug = file.replace(/\.mdx$/, "");
    const raw = fs.readFileSync(path.join(SERVICES_DIR, file), "utf8");
    const { data, content } = matter(raw);
    const rt = readingTime(content);

    return {
      slug,
      title: String(data.title ?? slug),
      description: String(data.description ?? ""),
      date: data.date ? String(data.date) : undefined,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      cover: data.cover ? String(data.cover) : undefined,
      intent: data.intent ? String(data.intent) : undefined,
      readingMinutes: Math.max(1, Math.round(rt.minutes)),
    };
  });

  return items.sort((a, b) => (String(a.date ?? "") < String(b.date ?? "") ? 1 : -1));
}

export function getServiceMdxRaw(slug: string) {
  const filePath = path.join(SERVICES_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  return { frontmatter: data, content };
}

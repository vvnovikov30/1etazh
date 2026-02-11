import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Re-export types from generated file
export type { BlogIndexItem } from "./blog.generated";
export { blogIndex } from "./blog.generated";

// Legacy type alias for backward compatibility
export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  cover?: string;
  readingMinutes?: number;
};

// Use generated index instead of fs operations
import { blogIndex as generatedBlogIndex } from "./blog.generated";

export function getAllBlogPosts(): BlogPost[] {
  return generatedBlogIndex.map((item) => ({
    slug: item.slug,
    title: item.title,
    description: item.description,
    date: item.date,
    tags: item.tags,
    cover: item.cover,
    readingMinutes: item.readingMinutes,
  }));
}

export function getAllPosts(): BlogPost[] {
  return getAllBlogPosts();
}

// This function still needs fs for reading individual posts
const BLOG_DIR = path.join(process.cwd(), "content", "blog");

export function getBlogPost(slug: string) {
  const file = path.join(BLOG_DIR, `${slug}.mdx`);
  const raw = fs.readFileSync(file, "utf8");
  const { data, content } = matter(raw);
  return { data, content };
}

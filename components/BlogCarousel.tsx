"use client";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/Card";
import { Carousel } from "@/components/Carousel";
import { Badge } from "@/components/Badge";

export type BlogCarouselPost = {
  slug: string;
  title: string;
  description: string;
  cover?: string;
  date?: string;
  readingMinutes?: number;
  tags?: string[];
};

export function BlogCarousel({ posts }: { posts: BlogCarouselPost[] }) {
  if (posts.length === 0) return null;

  return (
    <Carousel
      items={posts}
      renderItem={(post) => {
        const coverSrc = post.cover?.startsWith("http") ? post.cover : post.cover;
        return (
          <Link href={`/blog/${post.slug}`} className="block">
            <Card className="group h-full w-[300px] p-5 transition-transform hover:-translate-y-0.5">
              {coverSrc && (
                <div className="relative mb-4 h-40 w-full overflow-hidden rounded-[var(--radius-card)]">
                  {coverSrc.startsWith("http") ? (
                    // eslint-disable-next-line @next/next/no-img-element -- Remote covers can come from arbitrary domains; using next/image would require a domain allowlist and could break existing content.
                    <img
                      src={coverSrc}
                      alt={post.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <Image
                      src={coverSrc}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                      sizes="300px"
                    />
                  )}
                </div>
              )}
              {(post.date || post.readingMinutes) && (
                <div className="text-xs text-[var(--color-text)]/70">
                  {post.date ?? ""}
                  {post.date && post.readingMinutes ? " · " : ""}
                  {post.readingMinutes ? `~${post.readingMinutes} мин` : ""}
                </div>
              )}
              <h3 className="mt-2 text-lg font-semibold leading-snug text-[var(--color-text)]">
                {post.title}
              </h3>
              <p className="mt-2 text-sm text-[var(--color-text)]/80 line-clamp-3">{post.description}</p>
              {post.tags && post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <span className="text-sm text-[var(--color-primary)] hover:underline">Читать →</span>
              </div>
            </Card>
          </Link>
        );
      }}
      itemClassName="w-[300px]"
      autoScroll={false}
      showArrows={true}
      showProgress={true}
      ariaLabel="Карусель статей блога"
      infinite={true}
      shuffleSeedKey="blogCarouselSeed"
    />
  );
}

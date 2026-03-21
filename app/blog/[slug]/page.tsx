import { notFound } from "next/navigation";
import { blogIndex } from "@/lib/blog.generated";
import { getBlogPostBySlug } from "@/lib/mdx";
import { JsonLd } from "@/components/JsonLd";
import { blogPostingJsonLd } from "@/lib/seo";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { LINKS } from "@/lib/links";

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = blogIndex.find((p) => p.slug === slug);
  if (!meta) return notFound();

  const post = await getBlogPostBySlug(slug);

  return (
    <main>
      <Section>
        <Container>
          <JsonLd data={blogPostingJsonLd(meta)} />

          <article className="max-w-[800px]">
            <div className="text-xs text-[var(--color-text)]/70">
              {meta.date} · ~{meta.readingMinutes} мин
            </div>
            <h1 className="mt-2">{meta.title}</h1>
            <p className="mt-4 text-[var(--color-text)]/80">{meta.description}</p>

            <div className="rich-text mt-10">
              <post.Content />
            </div>

            <div className="mt-10">
              <p className="text-[var(--color-text)]/80">
                Строим и проектируем дома. Делимся технологиями и отвечаем на вопросы в Telegram.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button
                  as="a"
                  href={LINKS.telegramChannel}
                  target="_blank"
                  rel="noreferrer"
                  variant="secondary"
                >
                  Подписаться на канал
                </Button>
                <Button
                  as="a"
                  href={LINKS.telegramChat}
                  target="_blank"
                  rel="noreferrer"
                  variant="secondary"
                >
                  Обсудить в чате
                </Button>
              </div>
            </div>
          </article>
        </Container>
      </Section>
    </main>
  );
}

import Link from "next/link";
import { blogIndex } from "@/lib/blog.generated";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { Badge } from "@/components/Badge";

export default function BlogIndex() {
  const posts = blogIndex;

  return (
    <main>
      <Section>
        <Container>
          <div className="max-w-2xl">
            <h1>Блог</h1>
            <p className="mt-3 text-[var(--color-text)]/80">
              Разборы узлов и решений: фундамент, вентиляция, энергоэффективность, обследования.
            </p>
          </div>
        </Container>
      </Section>

      <Section className="bg-[var(--color-bg-light)]">
        <Container>
          <div className="grid gap-6 md:grid-cols-2">
            {posts.map((p) => (
              <Card key={p.slug} className="p-6">
                <div className="text-xs text-[var(--color-text)]/70">
                  {p.date} · ~{p.readingMinutes} мин
                </div>
                <div className="mt-2 text-lg font-semibold text-[var(--color-text)]">
                  <Link href={`/blog/${p.slug}`} className="text-[var(--color-text)]">
                    {p.title}
                  </Link>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text)]/80">{p.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {p.tags.slice(0, 3).map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
                <div className="mt-4 text-sm">
                  <Link href={`/blog/${p.slug}`}>Читать →</Link>
                </div>
              </Card>
            ))}
          </div>
        </Container>
      </Section>
    </main>
  );
}

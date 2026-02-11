import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { services } from "@/lib/services";
import { CTABar } from "@/components/CTABar";
import { hasServiceMdx } from "@/lib/services-mdx";
import { getServiceBySlug } from "@/lib/mdx-services";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { JsonLd } from "@/components/JsonLd";
import { serviceJsonLd } from "@/lib/seo";

type Params = { slug: string };

export async function generateStaticParams() {
  // страницы генерим по списку услуг (можно расширить, если добавишь чисто MDX-услуги без entries в массив)
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const s = services.find((x) => x.slug === params.slug);
  if (!s) return {};

  return {
    title: `${s.title} — Одноэтажники.РФ`,
    description: s.description,
    alternates: { canonical: `/services/${s.slug}` },
    openGraph: {
      title: s.title,
      description: s.description,
      url: `/services/${s.slug}`,
      type: "website",
    },
  };
}

export default async function ServicePage({ params }: { params: Params }) {
  const s = services.find((x) => x.slug === params.slug);
  if (!s) return notFound();

  const mdxExists = hasServiceMdx(params.slug);
  const mdx = mdxExists ? await getServiceBySlug(params.slug) : null;

  return (
    <main>
      <Section>
        <Container>
          <JsonLd data={serviceJsonLd(s)} />
          <div className="max-w-[800px]">
            <div className="text-sm text-[var(--color-text)]/70">
              <Link href="/services" className="text-[var(--color-text)]">
                Услуги
              </Link>
              <span className="mx-2">·</span>
              {s.category}
            </div>

            <h1 className="mt-3">{s.title}</h1>
            <p className="mt-3 text-[var(--color-text)]/80">{s.description}</p>

            <Card className="mt-6 p-6">
              <div className="font-semibold text-[var(--color-text)]">Быстрый расчёт / консультация</div>
              <p className="mt-2 text-[var(--color-text)]/80">
                Проще всего — написать в Telegram. В канале — разборы решений и узлов.
              </p>
              <div className="mt-4">
                <CTABar primaryText="Написать / расчёт" />
              </div>
            </Card>

            {mdx ? (
              <article className="rich-text mt-10">
                <mdx.Content />
              </article>
            ) : (
              <article className="mt-10 space-y-10">
                <section>
                  <h2>Когда это нужно</h2>
                  <ul className="mt-3 space-y-2 text-[var(--color-text)]/80">
                    <li>Типовые ситуации и задачи клиента.</li>
                    <li>Ожидаемый результат: комфорт, защита, экономия.</li>
                  </ul>
                </section>

                <section>
                  <h2>Как мы работаем</h2>
                  <ol className="mt-3 space-y-2 text-[var(--color-text)]/80">
                    <li>Консультация / замер</li>
                    <li>Согласование решения и сметы</li>
                    <li>Монтаж / выполнение работ</li>
                    <li>Сдача и рекомендации</li>
                  </ol>
                </section>

                <section>
                  <h2>FAQ</h2>
                  <div className="mt-3 space-y-3">
                    <details className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
                      <summary className="cursor-pointer font-medium text-[var(--color-text)]">
                        Сколько времени занимает?
                      </summary>
                      <p className="mt-2 text-[var(--color-text)]/80">
                        Зависит от объёма. Назовём точный срок после замера/ТЗ.
                      </p>
                    </details>
                    <details className="rounded-[var(--radius-card)] border border-[var(--color-border)] p-4">
                      <summary className="cursor-pointer font-medium text-[var(--color-text)]">
                        Какая гарантия?
                      </summary>
                      <p className="mt-2 text-[var(--color-text)]/80">
                        Фиксируем в договоре, зависит от типа работ и материалов.
                      </p>
                    </details>
                  </div>
                </section>
              </article>
            )}

            <Card className="mt-10 p-6">
              <h2>Обсудим ваш кейс</h2>
              <p className="mt-2 text-[var(--color-text)]/80">
                Напишите в Telegram — подскажем конфигурацию и стоимость под ваш проём.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button as={Link} href="/contacts">
                  Рассчитать стоимость
                </Button>
                <Button as={Link} href="/services" variant="secondary">
                  Все услуги
                </Button>
              </div>
            </Card>
          </div>
        </Container>
      </Section>
    </main>
  );
}

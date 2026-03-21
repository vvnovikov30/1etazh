import Link from "next/link";
import { blogIndex } from "@/lib/blog.generated";
import { BlogCarousel } from "@/components/BlogCarousel";
import { ShowroomCarousel } from "@/components/ShowroomCarousel";
import { MiniFAQ, type FAQItem } from "@/components/MiniFAQ";
import { JsonLd } from "@/components/JsonLd";
import { websiteJsonLd, organizationJsonLd, faqPageJsonLd } from "@/lib/seo";
import { Container } from "@/components/Container";
import { Section } from "@/components/Section";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { LeadForm } from "@/components/LeadForm";
import { services } from "@/lib/services";
import { showroomSlides } from "@/lib/showroom";
import { LINKS } from "@/lib/links";

export default function HomePage() {
  const posts = blogIndex
    .slice(0, 5)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      description: post.description,
      cover: post.cover,
      date: post.date,
      readingMinutes: post.readingMinutes,
      tags: post.tags,
    }));

  const advantages = [
    "Учёт инсоляции",
    "Учёт розы ветров",
    "Учёт глубины промерзания",
    "Естественная вентиляция",
    "Окна в санузлах и гардеробных",
    "Безбарьерная среда",
  ];

  const faqItems: FAQItem[] = [
    {
      question: "Сколько стоит одноэтажный дом под ключ?",
      answer: "Стоимость зависит от площади, материалов и инженерных систем. Обычно от 3–4 млн рублей за дом 100–120 м². Точный расчёт после уточнения участка и требований.",
    },
    {
      question: "Можно ли приехать в шоурум?",
      answer: "Да, можно приехать и посмотреть реальный дом: конструктив, инженерные решения, отделку. Запишитесь на просмотр через форму или по телефону.",
    },
    {
      question: "Сколько длится строительство?",
      answer: "Строительство одноэтажного дома под ключ занимает 4–6 месяцев в зависимости от сложности проекта и сезона. Сроки уточняются в договоре.",
    },
    {
      question: "Работаете по договору?",
      answer: "Да, работаем строго по договору с фиксированной стоимостью, графиком работ и гарантией. Все этапы прописаны, изменения согласовываются.",
    },
    {
      question: "Какой фундамент используете?",
      answer: "В зависимости от грунта: УШП (утеплённая шведская плита), ленточный или свайно-ростверковый. Выбор после анализа участка и расчёта нагрузок.",
    },
  ];

  // P0: Используем LINKS вместо прямого доступа к process.env
  // LINKS уже обрабатывает NEXT_PUBLIC_ переменные безопасно
  const telegramDiscussionUrl = LINKS.telegramChat;
  const telegramChannelUrl = LINKS.telegramChannel;

  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={faqPageJsonLd(faqItems)} />

      <main>
        {/* 1) HERO */}
        <Section>
          <Container className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h1>Одноэтажные дома для жизни</h1>
              <p className="mt-4 max-w-2xl text-[var(--color-text)]/80">
                Проектируем под участок, учитываем нормы и конструктив. Минимум энергозависимых систем.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button as={Link} href="#lead">
                  Получить консультацию
                </Button>
                <Button as={Link} href="/services" variant="secondary">
                  Посмотреть услуги
                </Button>
              </div>
            </div>
            <div className="h-[260px] w-full rounded-[var(--radius-card)] bg-[var(--color-bg-light)] md:h-[360px]">
              {/* placeholder image */}
            </div>
          </Container>
        </Section>

        {/* 2) Блог-карусель (BlogCarousel) */}
        <Section className="bg-[var(--color-bg-light)]">
          <Container>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h2>Разбираем технологии строительства</h2>
                <p className="mt-2 text-[var(--color-text)]/80">
                  Пишем простыми словами: фундамент, вентиляция, утепление, контроль качества.
                </p>
              </div>
              <Button as={Link} href="/blog" variant="secondary">
                Смотреть все статьи
              </Button>
            </div>
            <div className="mt-6">
              <BlogCarousel posts={posts} />
            </div>
          </Container>
        </Section>

        {/* 3) Шоурум-карусель (ShowroomCarousel) */}
        <Section className="bg-[var(--color-bg-light)]">
          <Container>
            <div>
              <h2>Посетите наш шоурум</h2>
              <p className="mt-2 text-[var(--color-text)]/80">
                Можно приехать и посмотреть реальный дом: конструктив, инженерные решения, отделка.
              </p>
            </div>
            <div className="mt-6">
              <ShowroomCarousel slides={showroomSlides} />
            </div>
          </Container>
        </Section>

        {/* 4) Услуги (Services grid) */}
        <Section>
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2>Услуги</h2>
                <p className="mt-2 text-[var(--color-text)]/80">
                  Проектирование, строительство и дополнительные работы по дому.
                </p>
              </div>
              <Button as={Link} href="/services" variant="secondary">
                Все услуги
              </Button>
            </div>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.slice(0, 6).map((service) => (
                <Card key={service.slug} className="flex h-full flex-col justify-between p-6">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-[var(--color-text)]/60">
                      {service.category}
                    </div>
                    <div className="mt-2 text-lg font-semibold text-[var(--color-text)]">{service.title}</div>
                    <p className="mt-2 text-sm text-[var(--color-text)]/80">{service.description}</p>
                  </div>
                  <div className="mt-6">
                    <Button as={Link} href={`/services/${service.slug}`} variant="secondary">
                      Подробнее
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* 5) Блок "почему доверяют" (Преимущества) */}
        <Section>
          <Container>
            <h2>Почему доверяют</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {advantages.map((item) => (
                <Card key={item} className="p-5">
                  <div className="text-base font-medium text-[var(--color-text)]">{item}</div>
                </Card>
              ))}
            </div>
          </Container>
        </Section>

        {/* 6) Мини-FAQ (для AIO) */}
        <Section className="bg-[var(--color-bg-light)]">
          <Container>
            <h2>Частые вопросы</h2>
            <p className="mt-2 text-[var(--color-text)]/80">Короткие ответы на главные вопросы о строительстве.</p>
            <div className="mt-8">
              <MiniFAQ items={faqItems} />
            </div>
          </Container>
        </Section>

        {/* 7) Telegram блок */}
        <Section>
          <Container>
            <Card className="p-8 text-center">
              <h2>Обсуждение в Telegram</h2>
              <p className="mt-3 text-[var(--color-text)]/80">
                Задавайте вопросы, делитесь опытом, получайте консультации по строительству.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button as="a" href={telegramChannelUrl} target="_blank" rel="noreferrer" variant="secondary">
                  Подписаться на канал
                </Button>
                <Button as="a" href={telegramDiscussionUrl} target="_blank" rel="noreferrer">
                  Обсудить в чате
                </Button>
              </div>
            </Card>
          </Container>
        </Section>

        {/* 8) Форма заявки (id="lead") */}
        <Section id="lead" className="bg-[var(--color-bg-light)]">
          <Container className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h2>Форма заявки</h2>
              <p className="mt-3 text-[var(--color-text)]/80">
                Оставьте контакты — уточним участок, бюджет и сроки.
              </p>
              <LeadForm />
            </div>
            <Card className="p-6">
              <div className="text-sm uppercase tracking-wide text-[var(--color-text)]/60">Что мы уточняем</div>
              <ul className="mt-4 space-y-2 text-sm text-[var(--color-text)]/80">
                <li>Локация и особенности участка</li>
                <li>Площадь и состав помещений</li>
                <li>Инженерия и материалы</li>
                <li>Сроки и бюджет</li>
              </ul>
            </Card>
          </Container>
        </Section>
      </main>
    </>
  );
}

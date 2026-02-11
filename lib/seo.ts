import { LINKS } from "@/lib/links";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://одноэтажники.рф";

function getOrganization() {
  return {
    "@type": "Organization",
    name: "Одноэтажники.РФ",
    url: SITE_URL,
    telephone: LINKS.phoneE164,
    email: LINKS.email,
    sameAs: [LINKS.telegramChat, LINKS.telegramChannel],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Одноэтажники.РФ",
    url: SITE_URL,
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Одноэтажники.РФ",
    url: SITE_URL,
    telephone: LINKS.phoneE164,
    email: LINKS.email,
    sameAs: [LINKS.telegramChat, LINKS.telegramChannel],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: LINKS.phoneE164,
        email: LINKS.email,
        availableLanguage: ["ru"],
        areaServed: "RU-MOS",
      },
      {
        "@type": "ContactPoint",
        contactType: "support",
        telephone: LINKS.phoneE164,
        email: LINKS.email,
        availableLanguage: ["ru"],
        areaServed: "RU-MOS",
      },
    ],
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Московская область",
    },
  };
}

export function serviceJsonLd(s: { title: string; description: string; slug: string; category?: string }) {
  const serviceUrl = `${SITE_URL}/services/${s.slug}`;
  const service: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.title,
    description: s.description,
    url: serviceUrl,
    provider: getOrganization(),
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Московская область",
    },
    audience: {
      "@type": "Audience",
      audienceType: "Homeowners",
    },
  };

  if (s.category) {
    service.serviceType = s.category;
  }

  return service;
}

export function blogPostingJsonLd(p: {
  title: string;
  description: string;
  slug: string;
  date: string;
  cover?: string;
}) {
  const postUrl = `${SITE_URL}/blog/${p.slug}`;
  const post: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.description,
    datePublished: p.date,
    dateModified: p.date,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    url: postUrl,
    author: getOrganization(),
    publisher: getOrganization(),
  };

  if (p.cover) {
    const imageUrl = p.cover.startsWith("http") ? p.cover : `${SITE_URL}${p.cover.startsWith("/") ? p.cover : `/${p.cover}`}`;
    post.image = imageUrl;
  }

  return post;
}

export function contactPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    url: `${SITE_URL}/contacts`,
    mainEntity: {
      "@type": "Organization",
      name: "Одноэтажники.РФ",
      url: SITE_URL,
      telephone: LINKS.phoneE164,
      email: LINKS.email,
      sameAs: [LINKS.telegramChat, LINKS.telegramChannel],
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "sales",
          telephone: LINKS.phoneE164,
          email: LINKS.email,
          availableLanguage: ["ru"],
          areaServed: "RU-MOS",
        },
        {
          "@type": "ContactPoint",
          contactType: "support",
          telephone: LINKS.phoneE164,
          email: LINKS.email,
          availableLanguage: ["ru"],
          areaServed: "RU-MOS",
        },
      ],
    },
  };
}

export function faqPageJsonLd(faqItems: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

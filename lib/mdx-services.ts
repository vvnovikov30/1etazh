import { getServiceMdxRaw } from "@/lib/services-mdx";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import * as devRuntime from "react/jsx-dev-runtime";
import remarkGfm from "remark-gfm";

// сюда позже можно подключать компоненты для MDX-услуг (Callout, Pricing, etc.)
const components = {};

export async function getServiceBySlug(slug: string) {
  const raw = getServiceMdxRaw(slug);
  if (!raw) return null;

  const isDev = process.env.NODE_ENV !== "production";
  const { default: MDXContent } = await evaluate(raw.content, {
    ...(isDev ? devRuntime : runtime),
    development: isDev,
    remarkPlugins: [remarkGfm],
  });

  return {
    frontmatter: raw.frontmatter,
    Content: (props: Record<string, unknown>) =>
      runtime.jsx(MDXContent, { components, ...props }),
  };
}

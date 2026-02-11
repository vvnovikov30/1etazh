import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import * as devRuntime from "react/jsx-dev-runtime";
import remarkGfm from "remark-gfm";
import { getBlogPost } from "@/lib/blog";

// сюда позже можно подключать компоненты для MDX-блога (Callout, Quote, etc.)
const components = {};

export async function getBlogPostBySlug(slug: string) {
  const raw = getBlogPost(slug);

  const isDev = process.env.NODE_ENV !== "production";
  const { default: MDXContent } = await evaluate(raw.content, {
    ...(isDev ? devRuntime : runtime),
    ...runtime,
    development: isDev,
    remarkPlugins: [remarkGfm],
  });

  return {
    frontmatter: raw.data,
    Content: (props: Record<string, unknown>) =>
      runtime.jsx(MDXContent, { components, ...props }),
  };
}

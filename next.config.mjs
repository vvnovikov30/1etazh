import createMDX from "@next/mdx";
import remarkGfm from "remark-gfm";

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
  },
});

const nextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/System Volume Information/**"],
    };
    return config;
  },
};

export default withMDX(nextConfig);

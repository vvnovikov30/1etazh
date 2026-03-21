export function JsonLd({ data }: { data: unknown }) {
  let json: string | null = null;
  try {
    json = JSON.stringify(data);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("JsonLd stringify error:", e);
      console.error("JsonLd data:", data);
    }
    return null;
  }
  if (!json) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

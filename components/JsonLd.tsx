export function JsonLd({ data }: { data: unknown }) {
  try {
    const json = JSON.stringify(data);
    return (
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: json }}
      />
    );
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("JsonLd stringify error:", e);
      console.error("JsonLd data:", data);
    }
    return null;
  }
}

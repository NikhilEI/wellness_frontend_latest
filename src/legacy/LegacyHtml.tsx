export default function LegacyHtml({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />;
}

import type { Metadata } from "next";
import LegacyPage from "@/legacy/LegacyPage";
import { meta, html, scripts } from "@/legacy-content/responseNewsletter";

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords
};

export default function ResponseNewsletterPage() {
  return <LegacyPage html={html} scripts={scripts} />;
}

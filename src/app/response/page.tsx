import type { Metadata } from "next";
import LegacyPage from "@/legacy/LegacyPage";
import { meta, html, scripts } from "@/legacy-content/response";

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords
};

export default function ResponsePage() {
  return <LegacyPage html={html} scripts={scripts} />;
}

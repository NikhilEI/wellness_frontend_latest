import type { Metadata } from "next";
import LegacyPage from "@/legacy/LegacyPage";
import { meta, html, scripts } from "@/legacy-content/exhibitorProfile";

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords
};

export default function ExhibitorProfilePage() {
  return <LegacyPage html={html} scripts={scripts} />;
}

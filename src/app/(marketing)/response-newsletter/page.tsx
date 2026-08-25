import type { Metadata } from "next";
import Header from "@/components/legacy/Header";
import Footer from "@/components/legacy/Footer";
import LegacyHtml from "@/legacy/LegacyHtml";
import LegacyScripts from "@/legacy/LegacyScripts";
import { meta, html, scripts } from "@/legacy-content/responseNewsletter";

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords
};

export default function ResponseNewsletterPage() {
  return (
    <>
      <Header />
      <LegacyHtml html={html} />
      <Footer />
      <LegacyScripts scripts={scripts} />
    </>
  );
}

import type { Metadata } from "next";
import Header from "@/components/legacy/Header";
import Footer from "@/components/legacy/Footer";
import LegacyHtml from "@/legacy/LegacyHtml";
import LegacyScripts from "@/legacy/LegacyScripts";
import BrochureDownloadModal from "@/components/BrochureDownloadModal";
import { meta, html, scripts } from "@/legacy-content/default";

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords
};

export default function HomePage() {
  return (
    <>
      <Header />
      <LegacyHtml html={html} />
      <Footer />
      <LegacyScripts scripts={scripts} />
      <BrochureDownloadModal />
    </>
  );
}

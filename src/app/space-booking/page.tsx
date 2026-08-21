import type { Metadata } from "next";
import LegacyPage from "@/legacy/LegacyPage";
import RecaptchaWidget from "@/components/RecaptchaWidget";
import { meta, html, scripts } from "@/legacy-content/spaceBooking";

export const metadata: Metadata = {
  title: meta.title,
  description: meta.description,
  keywords: meta.keywords
};

export default function SpaceBookingPage() {
  return (
    <>
      <LegacyPage html={html} scripts={scripts} />
      <RecaptchaWidget />
    </>
  );
}

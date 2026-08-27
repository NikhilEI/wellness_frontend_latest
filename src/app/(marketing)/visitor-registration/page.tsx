import type { Metadata } from "next";
import Header from "@/components/legacy/Header";
import Footer from "@/components/legacy/Footer";
import VisitorRegistrationForm from "@/components/VisitorRegistrationForm";
import AdditionalInfoContacts, { PRINCE_SINGH_CONTACT, PANKAJ_JAIN_CONTACT } from "@/components/AdditionalInfoContacts";

export const metadata: Metadata = {
  title: "Wellness India Expo 2027 - Visitor Registration",
  description:
    "Register as a visitor for Wellness India Expo 2027, India's premier platform for the wellness, health, fitness, beauty, nutrition, and lifestyle industries.",
  keywords: "Wellness India Expo 2027, Visitor Registration, Bharat Mandapam New Delhi"
};

export default function VisitorRegistrationPage() {
  return (
    <>
      <Header />
      <section className="section-inner-pages">
        <div className="container-xxl">
          <div className="row align-items--center gx-lg-5">
            <div className="col-lg-9 col-md-8 col-sm-6">
              <div className="space-booking-right-box-main">
                <div className="world-say-heading-home">
                  Visitor <span className="ai-bharat-expo">Registration</span>
                </div>
                <div className="col-para-left mb-5">
                  <span className="heading-sub--para">
                    Step into India&apos;s biggest technology expo. Connect with innovators, thought leaders and
                    global brands showcasing emerging trends in 6G, AI &amp; Analytics, Future Mobility, Digital
                    Economies, Cybersecurity, Fintech, Cloud &amp; Edge &amp; more. Entry allowed only for Business
                    Visitors above 18 years of age. Student entry is permitted only on Day 3 from 12:00 PM onward.
                  </span>
                </div>

                <VisitorRegistrationForm />

                <AdditionalInfoContacts contacts={[PRINCE_SINGH_CONTACT, PANKAJ_JAIN_CONTACT]} />
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

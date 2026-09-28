import type { Metadata } from "next";
import Header from "@/components/legacy/Header";
import Footer from "@/components/legacy/Footer";
import SpeakerRegistrationForm from "@/components/SpeakerRegistrationForm";
import AdditionalInfoContacts, { PRINCE_SINGH_CONTACT, PANKAJ_JAIN_CONTACT } from "@/components/AdditionalInfoContacts";

export const metadata: Metadata = {
  title: "Wellness India Expo 2027 - Speaker Registration",
  description:
    "Speaker registrations are now open for Wellness India Expo 2027. Submit your details to present panel discussions, fireside chats, and keynote sessions.",
  keywords: "Wellness India Expo 2027, Speaker Registration, Bharat Mandapam New Delhi"
};

export default function SpeakerRegistrationPage() {
  return (
    <>
      <Header />
      <section className="section-inner-pages">
        <div className="container-xxl">
          <div className="row align-items--center gx-lg-5">
            <div className="col-lg-9 col-md-8 col-sm-6">
              <div className="space-booking-right-box-main">
                <div className="world-say-heading-home">
                  Speaker <span className="ai-bharat-expo">Registration</span>
                </div>
                <div className="col-para-left mb-3">
                  <span className="heading-sub--para">
                    Speaker Registrations are now open for your submissions. Our Conference Committee is looking for
                    content focussed on wellness, fitness, health span, digital health, longevity and clean beauty.
                  </span>
                </div>

                <div className="col-para-left mb-5">
                  Please submit your details in the form below and a member of our team will get in touch with you.
                </div>

                <SpeakerRegistrationForm />

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

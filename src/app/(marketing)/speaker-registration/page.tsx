import type { Metadata } from "next";
import Header from "@/components/legacy/Header";
import Footer from "@/components/legacy/Footer";
import RecaptchaWidget from "@/components/RecaptchaWidget";
import SpeakerRegistrationForm from "@/components/SpeakerRegistrationForm";
import AdditionalInfoContacts, { PRINCE_SINGH_CONTACT, PANKAJ_JAIN_CONTACT } from "@/components/AdditionalInfoContacts";
import styles from "@/components/SpeakerRegistrationIntro.module.css";

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
                <div className="col-para-left mb-5">
                  <span className="heading-sub--para">
                    Speaker Registrations are now open for your submissions to present when we meet again in person
                    next year. Our Conference Committee is looking for content focussed on solutions to accelerate
                    Nation Building. This unique event provides an opportunity to discuss and bring forth the most
                    inspiring ideas to strengthen capacities, increase collaboration and share inspiration to support
                    and improve the development of our nation.
                  </span>
                </div>

                <h3 className={styles.criteriaHeading}>Selection Criteria</h3>
                <ul className={styles.criteriaList}>
                  <li>Strong alignment with the expo&apos;s core theme and focus areas</li>
                  <li>Relevance to current and emerging industry trends and challenges</li>
                </ul>

                <h3 className={styles.criteriaHeading}>Guidelines</h3>
                <ul className={styles.criteriaList}>
                  <li>Speaker participation is subject to review and final approval by the Conference Committee</li>
                  <li>Session formats include Panel Discussions, Fireside chat and keynote sessions</li>
                </ul>

                <div className="col-para-left mb-5" style={{ marginTop: 12 }}>
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
      <RecaptchaWidget />
    </>
  );
}

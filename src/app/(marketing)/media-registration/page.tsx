import type { Metadata } from "next";
import Header from "@/components/legacy/Header";
import Footer from "@/components/legacy/Footer";
import RecaptchaWidget from "@/components/RecaptchaWidget";
import MediaRegistrationForm from "@/components/MediaRegistrationForm";
import AdditionalInfoContacts, { PRINCE_SINGH_CONTACT, PANKAJ_JAIN_CONTACT } from "@/components/AdditionalInfoContacts";
import styles from "@/components/SpeakerRegistrationIntro.module.css";

export const metadata: Metadata = {
  title: "Wellness India Expo 2027 - Press Registration Form",
  description:
    "Press and media registration for Wellness India Expo 2027. Submit your details for media accreditation.",
  keywords: "Wellness India Expo 2027, Press Registration, Media Accreditation, Bharat Mandapam New Delhi"
};

export default function MediaRegistrationPage() {
  return (
    <>
      <Header />
      <section className="section-inner-pages">
        <div className="container-xxl">
          <div className="row align-items--center gx-lg-5">
            <div className="col-lg-9 col-md-8 col-sm-6">
              <div className="space-booking-right-box-main">
                <div className="world-say-heading-home">
                  Press <span className="ai-bharat-expo">Registration Form</span>
                </div>
                <div className="col-para-left mb-5">
                  <span className="heading-sub--para">
                    Please submit your details in the form below and a member of our team will get in touch with
                    you.
                  </span>
                </div>

                <h3 className={styles.criteriaHeading}>Important Information</h3>
                <ul className={styles.criteriaList}>
                  <li>All media personnel must display the badge to enable organizers to identify them at the show.</li>
                  <li>Accreditation of media is subject to acceptance by the communications department.</li>
                </ul>

                <MediaRegistrationForm />

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

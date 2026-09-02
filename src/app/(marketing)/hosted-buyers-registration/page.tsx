import type { Metadata } from "next";
import Header from "@/components/legacy/Header";
import Footer from "@/components/legacy/Footer";
import HostedBuyersRegistrationForm from "@/components/HostedBuyersRegistrationForm";
import AdditionalInfoContacts, { PRINCE_SINGH_CONTACT, PANKAJ_JAIN_CONTACT } from "@/components/AdditionalInfoContacts";

export const metadata: Metadata = {
  title: "Wellness India Expo 2027 - Hosted Buyer Programme",
  description:
    "Join the Hosted Buyer Programme at Wellness India Expo 2027, India's Biggest Technology Expo. Connect with innovators, technology leaders and decision-makers to explore new business opportunities.",
  keywords: "Wellness India Expo 2027, Hosted Buyer Programme, Bharat Mandapam New Delhi"
};

export default function HostedBuyersRegistrationPage() {
  return (
    <>
      <Header />
      <section className="section-inner-pages">
        <div className="container-xxl">
          <div className="row align-items--center gx-lg-5">
            <div className="col-lg-9 col-md-8 col-sm-6">
              <div className="space-booking-right-box-main">
                <div className="world-say-heading-home">
                  Hosted Buyer <span className="ai-bharat-expo">Programme</span>
                </div>
                <div className="col-para-left mb-5">
                  <span className="heading-sub--para">
                    Open your brand to a world of new possibilities and opportunities by exhibiting at Wellness
                    India Expo 2027, India&apos;s Biggest Technology expo. Connect and engage with innovators, technology
                    leaders, decision-makers, pioneers, and industry veterans under one roof to showcase your
                    solutions, build valuable business connections, and explore the emerging trends shaping India&apos;s
                    digital and technological landscape.
                    <br />
                    <br />
                    We are glad to invite buyers engaged in international distribution, corporate Gifting &amp;
                    electronic retail chains as &ldquo;hosted buyers&rdquo; at the Wellness India Expo 2027,
                    India&apos;s Biggest Technology expo.
                    <br />
                    <br />
                    As a buyer it will be a great opportunity to tie up with new brands who are looking to expand in
                    the international market, corporate Gifting &amp; the untapped markets.
                    <br />
                    <br />
                    Kindly share your details, our team will get in touch with you for further information:
                  </span>
                </div>

                <HostedBuyersRegistrationForm />

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

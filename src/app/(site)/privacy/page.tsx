import type { Metadata } from "next";
import { LegalPage } from "@/components/prose-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${site.name} collects, uses and protects personal information.`,
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="—  (set this date when you publish)"
      sections={[
        {
          heading: "Who we are",
          body: <p>{site.name} (“we”, “us”) operates this website. You can contact us at {site.email} or {site.address}.</p>,
        },
        {
          heading: "Information we collect",
          body: (
            <ul>
              <li>Booking requests: name, email, phone, country (optional), number of travellers, chosen departure and any message you include.</li>
              <li>Contact form: name, email, optional phone, subject and message.</li>
              <li>Technical data: server logs such as IP address and browser type, used for security and to prevent abuse.</li>
            </ul>
          ),
        },
        {
          heading: "How we use it",
          body: (
            <ul>
              <li>To respond to your inquiry and arrange your trip.</li>
              <li>To hold seats on the departure you request while we review it.</li>
              <li>To keep the website secure and prevent spam.</li>
            </ul>
          ),
        },
        {
          heading: "Sharing",
          body: <p>We share details only with the suppliers needed to deliver your trip (for example accommodation and transport partners) once you confirm a booking, and with service providers that host this website or send email on our behalf. We do not sell personal information.</p>,
        },
        {
          heading: "Cookies",
          body: <p>The public site does not use advertising or analytics cookies. Your browser may store a list of trips you chose to compare; this stays on your device. The admin area uses a strictly necessary session cookie.</p>,
        },
        {
          heading: "Retention",
          body: <p>We keep inquiries and messages for as long as needed to handle them and meet legal obligations, then delete or anonymise them. Specify your retention period here.</p>,
        },
        {
          heading: "Your rights",
          body: <p>You may ask to access, correct or delete your personal information by writing to {site.email}. Describe the rights that apply in your jurisdiction here.</p>,
        },
      ]}
    />
  );
}

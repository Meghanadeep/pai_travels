import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/prose-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: `Terms that apply to booking requests and journeys with ${site.name}.`,
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & conditions"
      updated="—  (set this date when you publish)"
      sections={[
        {
          heading: "Booking requests",
          body: <p>Submitting a booking request on this website is an inquiry, not a contract. A booking is confirmed only when we confirm it to you in writing and any required payment has been received.</p>,
        },
        {
          heading: "Prices",
          body: <p>Prices are shown per person in {site.currency} and may change until your booking is confirmed. Early bird prices apply only to requests received before the stated end date.</p>,
        },
        {
          heading: "Payment",
          body: <p>No payment is taken on this website. Describe your deposit, balance due dates and accepted payment methods here.</p>,
        },
        {
          heading: "Changes and cancellations",
          body: (
            <p>
              Cancellations by you are subject to our <Link href="/cancellation-policy" className="link-underline">cancellation policy</Link> and any
              trip-specific terms. We may change or cancel a departure where necessary; if we cancel, we will offer an alternative or a refund of amounts paid.
            </p>
          ),
        },
        {
          heading: "Travel documents and insurance",
          body: <p>You are responsible for valid passports, visas, health requirements and adequate travel insurance. Requirements listed on journey pages are guidance only — check official sources before you travel.</p>,
        },
        {
          heading: "Liability",
          body: <p>Set out the extent and limits of your liability here, in line with the law that applies to your business.</p>,
        },
        {
          heading: "Governing law",
          body: <p>State the governing law and jurisdiction for these terms here.</p>,
        },
      ]}
    />
  );
}

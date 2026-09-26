import type { Metadata } from "next";
import { LegalPage } from "@/components/prose-page";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cancellation policy",
  description: `How cancellations, refunds and departure changes work at ${site.name}.`,
  alternates: { canonical: "/cancellation-policy" },
};

export default function CancellationPolicyPage() {
  return (
    <LegalPage
      title="Cancellation policy"
      updated="—  (set this date when you publish)"
      sections={[
        {
          heading: "Booking requests",
          body: <p>You can withdraw a booking request at any time before it is confirmed, free of charge — just reply to our email or write to {site.email}. Your held seats will be released.</p>,
        },
        {
          heading: "Cancelling a confirmed booking",
          body: (
            <>
              <p>Example scale — replace with your own terms:</p>
              <ul>
                <li>60 days or more before departure: full refund less a processing fee.</li>
                <li>59 to 30 days before departure: 50% refund.</li>
                <li>Fewer than 30 days before departure: no refund.</li>
              </ul>
              <p>Individual journeys may have different terms, shown on the journey page. Where they differ, the journey terms apply.</p>
            </>
          ),
        },
        {
          heading: "If we cancel",
          body: <p>If a departure does not reach its minimum group size or cannot run safely, we will tell you as early as possible and offer another date or a full refund of amounts paid.</p>,
        },
        {
          heading: "Insurance",
          body: <p>We strongly recommend travel insurance that covers cancellation from the moment your booking is confirmed.</p>,
        },
      ]}
    />
  );
}

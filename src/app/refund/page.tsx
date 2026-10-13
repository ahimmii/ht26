import { PolicyPage } from "@/components/ui/policy-page";

export default function RefundPage() {
  return (
    <PolicyPage
      title="Refund Policy"
      placeholder
      body={`[PLACEHOLDER — Confirm refund rules with the organizer before selling tickets.]

Tickets are generally non-refundable except if the event is cancelled or as required by applicable law.

If a refund is approved by the organizer, the related tickets are marked refunded and cannot be used for entry.

Unpaid reservations expire automatically and release inventory. Expiration is not a refund.`}
    />
  );
}

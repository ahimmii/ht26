import { PolicyPage } from "@/components/ui/policy-page";

export default function TermsPage() {
  return (
    <PolicyPage
      title="Terms & Conditions"
      placeholder
      body={`These terms apply to ticket purchases for Halloween Tangier 2026.

[PLACEHOLDER — The organizer must replace this with legally reviewed terms before public sale.]

Tickets are personal, limited, and valid for one entry. The door may refuse entry for dress-code, ID, or security reasons without creating a refund right beyond the published refund policy.

The platform processes orders, reservations, and digital tickets. Payment confirmation for offline transfers is performed by an authorized administrator after funds are verified. Online payments, when enabled, are confirmed only through authenticated server-side verification.`}
    />
  );
}

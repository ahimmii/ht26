import { PolicyPage } from "@/components/ui/policy-page";

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Privacy Policy"
      placeholder
      body={`[PLACEHOLDER — Have counsel review this policy before collecting personal data at scale.]

We collect the name, email, and phone number required to issue tickets and communicate about the event. Payment card details are never stored on this platform.

Analytics scripts (Meta Pixel, Google Analytics) load only after consent. Campaign and ambassador codes may be stored to attribute orders.

You may contact the organizer to request access or deletion of your order data, subject to legal retention needs for payments and entry records.`}
    />
  );
}

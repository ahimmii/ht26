import { saveEventSettingsAction } from "@/app/actions/admin";
import { getEventSettings } from "@/server/event";

export const instant = false;

function iso(value: Date) {
  const offset = value.getTimezoneOffset();
  return new Date(value.getTime() - offset * 60_000).toISOString().slice(0, 16);
}

export default async function AdminSettingsPage() {
  const event = await getEventSettings();
  const fields: Array<[string, string, string | number]> = [
    ["title", "Event title", event.title],
    ["titleFr", "Title (FR)", event.titleFr],
    ["tagline", "Tagline", event.tagline],
    ["taglineFr", "Tagline (FR)", event.taglineFr],
    ["venue", "Venue", event.venue],
    ["venueFr", "Venue (FR)", event.venueFr],
    ["address", "Address", event.address],
    ["city", "City", event.city],
    ["country", "Country", event.country],
    ["ticketPriceCents", "Price (centimes)", event.ticketPriceCents],
    ["currency", "Currency", event.currency],
    ["capacity", "Capacity", event.capacity],
    ["posterUrl", "Poster URL", event.posterUrl ?? ""],
    ["reservationMinutes", "Online reservation minutes", event.reservationMinutes],
    ["manualReservationHours", "Manual reservation hours", event.manualReservationHours],
    ["ageRestriction", "Age restriction", event.ageRestriction],
    ["bankName", "Bank name", event.bankName ?? ""],
    ["bankAccountName", "Account name", event.bankAccountName ?? ""],
    ["bankIban", "IBAN / RIB", event.bankIban ?? ""],
    ["bankReferenceHint", "Transfer hint", event.bankReferenceHint ?? ""],
    ["contactEmail", "Contact email", event.contactEmail],
    ["contactPhone", "Contact phone", event.contactPhone ?? ""],
    ["instagramUrl", "Instagram URL", event.instagramUrl ?? ""],
    ["tiktokUrl", "TikTok URL", event.tiktokUrl ?? ""],
    ["metaPixelId", "Meta Pixel ID", event.metaPixelId ?? ""],
    ["gaMeasurementId", "GA measurement ID", event.gaMeasurementId ?? ""],
  ];

  return (
    <div>
      <p className="eyebrow">Event settings</p>
      <h1 className="font-serif mt-3 text-4xl">House rules</h1>
      <form action={saveEventSettingsAction} className="mt-10 grid gap-6 md:grid-cols-2">
        {fields.map(([name, label, value]) => (
          <label key={name} className="block">
            <span className="eyebrow">{label}</span>
            <input name={name} defaultValue={value} className="input-dark" />
          </label>
        ))}
        <label className="block">
          <span className="eyebrow">Event date</span>
          <input type="datetime-local" name="date" defaultValue={iso(event.date)} className="input-dark" />
        </label>
        <label className="block">
          <span className="eyebrow">Sales open</span>
          <input type="datetime-local" name="salesOpenAt" defaultValue={iso(event.salesOpenAt)} className="input-dark" />
        </label>
        <label className="block">
          <span className="eyebrow">Sales close</span>
          <input type="datetime-local" name="salesCloseAt" defaultValue={iso(event.salesCloseAt)} className="input-dark" />
        </label>
        <label className="md:col-span-2">
          <span className="eyebrow">Description</span>
          <textarea name="description" defaultValue={event.description} rows={4} className="input-dark" />
        </label>
        <label className="md:col-span-2">
          <span className="eyebrow">Description (FR)</span>
          <textarea name="descriptionFr" defaultValue={event.descriptionFr} rows={4} className="input-dark" />
        </label>
        <button className="btn-blood md:col-span-2">Save settings</button>
      </form>
    </div>
  );
}

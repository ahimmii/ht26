import { SiteFooter } from "@/components/ui/site-footer";
import { SiteHeader } from "@/components/ui/site-header";
import { getLocale } from "@/lib/locale";
import { getEventSettings } from "@/server/event";

export const instant = false;

const faqs = {
  en: [
    ["Venue", "The exact address will be confirmed closer to the date. [PLACEHOLDER — organizer to confirm the disclosed venue policy.]"],
    ["Age restriction", "18+ only. Valid government ID is required at the door."],
    ["ID requirements", "Bring the same ID used to identify you if asked. Guest list names must match."],
    ["Dress code", "Dark, elevated, intentional. No sportswear. The door may refuse entry."],
    ["Entry rules", "Each QR code is valid for one entry only. No re-entry unless the organizer announces otherwise. [PLACEHOLDER]"],
    ["Ticket transfers", "Transfers are not automatic. Contact the organizer before the event. [PLACEHOLDER]"],
    ["Refunds", "See the refund policy. Purchases are generally final except where required by law or announced by the organizer."],
  ],
  fr: [
    ["Lieu", "L'adresse exacte sera confirmée plus près de la date. [PLACEHOLDER]"],
    ["Âge", "18+ uniquement. Une pièce d'identité officielle est exigée."],
    ["Identité", "Le nom sur le billet doit correspondre à la pièce présentée."],
    ["Dress code", "Sombre, élevé, intentionnel. Pas de sportwear. L'entrée peut être refusée."],
    ["Entrée", "Chaque QR code n'est valable que pour une seule entrée. [PLACEHOLDER]"],
    ["Transferts", "Les transferts ne sont pas automatiques. Contactez l'organisateur. [PLACEHOLDER]"],
    ["Remboursements", "Voir la politique de remboursement."],
  ],
};

export default async function FaqPage() {
  const locale = await getLocale();
  const event = await getEventSettings();
  const items = faqs[locale];

  return (
    <div className="min-h-screen">
      <SiteHeader locale={locale} />
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-32">
        <p className="eyebrow">{event.title}</p>
        <h1 className="font-serif mt-4 text-5xl">FAQ</h1>
        <div className="mt-12 space-y-10">
          {items.map(([q, a]) => (
            <div key={q} className="border-t border-white/10 pt-6">
              <h2 className="font-serif text-2xl">{q}</h2>
              <p className="mt-3 text-mist">{a}</p>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter locale={locale} />
    </div>
  );
}

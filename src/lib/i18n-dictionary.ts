import type { Locale } from "./i18n";

const en = {
  nav: {
    event: "The Night",
    tickets: "Tickets",
    faq: "FAQ",
    contact: "Contact",
    buy: "Buy tickets",
  },
  hero: {
    dateLine: "October 31 — Tangier",
    limited: "Limited capacity",
    guests: "guests",
    price: "Ticket price",
    buy: "Buy tickets",
    countdownLabel: "Until the gates open",
  },
  tickets: {
    title: "General admission",
    subtitle: "One night. One entry. No second chances.",
    quantity: "Quantity",
    each: "per ticket",
    total: "Total",
    remaining: "Remaining",
    checkout: "Continue to checkout",
    soldOut: "Sold out",
    closed: "Sales are closed",
    notOpen: "Sales have not opened yet",
    max: "Maximum 6 tickets per order",
  },
  checkout: {
    title: "Checkout",
    name: "Full name",
    email: "Email",
    phone: "Phone",
    promo: "Promo code",
    apply: "Apply",
    terms: "I accept the terms, privacy policy and refund policy.",
    payManual: "Pay by bank transfer",
    payCmi: "Pay online (CMI)",
    payStripe: "Pay with card (Stripe)",
    cmiUnavailable: "Online card payment (CMI) is not configured yet.",
    stripeUnavailable: "Card payment (Stripe) is not configured yet.",
    place: "Place order",
  },
  pending: {
    title: "Payment pending verification",
    body: "Your reservation is held while we confirm receipt of funds. Tickets are generated only after an authorized verification.",
  },
  confirmation: {
    title: "You are on the list",
    body: "Your tickets are confirmed. Check your email for the QR codes and downloadable PDFs.",
  },
  footer: {
    rights: "All rights reserved.",
    terms: "Terms",
    privacy: "Privacy",
    refund: "Refunds",
  },
};

const fr = {
  nav: {
    event: "La nuit",
    tickets: "Billets",
    faq: "FAQ",
    contact: "Contact",
    buy: "Acheter",
  },
  hero: {
    dateLine: "31 octobre — Tanger",
    limited: "Capacité limitée",
    guests: "invités",
    price: "Prix du billet",
    buy: "Acheter",
    countdownLabel: "Avant l'ouverture",
  },
  tickets: {
    title: "Admission générale",
    subtitle: "Une nuit. Une entrée. Pas de seconde chance.",
    quantity: "Quantité",
    each: "par billet",
    total: "Total",
    remaining: "Restants",
    checkout: "Continuer",
    soldOut: "Complet",
    closed: "Les ventes sont closes",
    notOpen: "Les ventes n'ont pas encore commencé",
    max: "Maximum 6 billets par commande",
  },
  checkout: {
    title: "Paiement",
    name: "Nom complet",
    email: "Email",
    phone: "Téléphone",
    promo: "Code promo",
    apply: "Appliquer",
    terms: "J'accepte les conditions, la politique de confidentialité et la politique de remboursement.",
    payManual: "Virement bancaire",
    payCmi: "Paiement en ligne (CMI)",
    payStripe: "Payer par carte (Stripe)",
    cmiUnavailable: "Le paiement CMI n'est pas encore configuré.",
    stripeUnavailable: "Le paiement Stripe n'est pas encore configuré.",
    place: "Valider la commande",
  },
  pending: {
    title: "Paiement en attente de vérification",
    body: "Votre réservation est maintenue jusqu'à confirmation des fonds. Les billets ne sont générés qu'après vérification.",
  },
  confirmation: {
    title: "Vous êtes sur la liste",
    body: "Vos billets sont confirmés. Consultez votre email pour les QR codes et les PDF.",
  },
  footer: {
    rights: "Tous droits réservés.",
    terms: "Conditions",
    privacy: "Confidentialité",
    refund: "Remboursements",
  },
};

export type Dictionary = typeof en;

export function getDictionary(locale: Locale): Dictionary {
  return locale === "fr" ? fr : en;
}

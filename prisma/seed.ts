import { PrismaClient, Role, DiscountType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "admin@halloween-tangier.local").toLowerCase();
  const staffEmail = (process.env.STAFF_EMAIL ?? "staff@halloween-tangier.local").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-this-admin-password";
  const staffPassword = process.env.STAFF_PASSWORD ?? "change-this-staff-password";

  const [adminHash, staffHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12),
    bcrypt.hash(staffPassword, 12),
  ]);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: Role.ADMIN, name: process.env.ADMIN_NAME ?? "Event Admin" },
    create: {
      email: adminEmail,
      passwordHash: adminHash,
      name: process.env.ADMIN_NAME ?? "Event Admin",
      role: Role.ADMIN,
    },
  });

  await prisma.user.upsert({
    where: { email: staffEmail },
    update: { role: Role.STAFF, name: process.env.STAFF_NAME ?? "Door Staff" },
    create: {
      email: staffEmail,
      passwordHash: staffHash,
      name: process.env.STAFF_NAME ?? "Door Staff",
      role: Role.STAFF,
    },
  });

  await prisma.eventSettings.upsert({
    where: { id: "default" },
    update: { posterUrl: "/logo.png" },
    create: {
      id: "default",
      title: "HALLOWEEN TANGIER 2026",
      titleFr: "HALLOWEEN TANGER 2026",
      tagline: "ONE NIGHT. NO SECOND CHANCES.",
      taglineFr: "UNE NUIT. PAS DE SECONDE CHANCE.",
      date: new Date("2026-10-31T22:00:00+01:00"),
      venue: "Undisclosed warehouse — Tangier",
      venueFr: "Entrepôt confidentiel — Tanger",
      address: "[VENUE ADDRESS TO BE CONFIRMED BY THE ORGANIZER]",
      city: "Tangier",
      country: "Morocco",
      ticketPriceCents: 25000,
      currency: "MAD",
      capacity: 160,
      description:
        "An exclusive Halloween night in Tangier. Limited capacity. No plus-ones at the door. Dress code is dark, elevated, and intentional.",
      descriptionFr:
        "Une nuit Halloween exclusive à Tanger. Capacité limitée. Pas d'invités supplémentaires à l'entrée. Dress code sombre, élevé, intentionnel.",
      posterUrl: "/logo.png",
      salesOpenAt: new Date("2026-03-01T00:00:00+01:00"),
      salesCloseAt: new Date("2026-10-31T20:00:00+01:00"),
      reservationMinutes: 15,
      manualReservationHours: 48,
      ageRestriction: 18,
      bankName: "[BANK NAME — PLACEHOLDER]",
      bankAccountName: "[ACCOUNT NAME — PLACEHOLDER]",
      bankIban: "[IBAN / RIB — PLACEHOLDER]",
      bankReferenceHint: "Use your order reference as the transfer reason.",
      contactEmail: "hello@halloween-tangier.local",
      contactPhone: "+212 000 000 000",
      instagramUrl: "",
      tiktokUrl: "",
    },
  });

  await prisma.promoCode.upsert({
    where: { code: "EARLYBIRD" },
    update: {},
    create: {
      code: "EARLYBIRD",
      type: DiscountType.PERCENTAGE,
      value: 10,
      usageLimit: 40,
      perCustomerLimit: 1,
      expiresAt: new Date("2026-08-31T23:59:59+01:00"),
    },
  });

  for (const [code, name] of [
    ["HALLO01", "Ambassador 01"],
    ["HALLO02", "Ambassador 02"],
    ["HALLO03", "Ambassador 03"],
  ] as const) {
    await prisma.ambassador.upsert({
      where: { code },
      update: { name, active: true },
      create: { code, name, active: true },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

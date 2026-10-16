import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { OrderStatus, PaymentMethod, PrismaClient, TicketStatus } from "@prisma/client";
import QRCode from "qrcode";
import { generatePublicCode, generateTicketToken } from "../src/lib/utils";

const REFERENCE = "HT26-TEST01";
const QUANTITY = 5;
const HOLDERS = [
  "Test Guest 1",
  "Test Guest 2",
  "Test Guest 3",
  "Test Guest 4",
  "Test Guest 5",
];

const prisma = new PrismaClient();

async function main() {
  const appUrl = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const event = await prisma.eventSettings.findUniqueOrThrow({ where: { id: "default" } });

  const existing = await prisma.order.findUnique({
    where: { reference: REFERENCE },
    include: { tickets: { orderBy: { createdAt: "asc" } } },
  });

  const order =
    existing ??
    (await prisma.$transaction(async (tx) => {
      const remaining = event.capacity - event.reservedCount - event.confirmedCount;
      if (remaining < QUANTITY) {
        throw new Error(`Not enough capacity for ${QUANTITY} test tickets (${remaining} left)`);
      }

      const created = await tx.order.create({
        data: {
          reference: REFERENCE,
          customerName: "Scanner Test",
          email: "test-tickets@halloween-tangier.local",
          phone: "+212600000000",
          quantity: QUANTITY,
          unitPriceCents: event.ticketPriceCents,
          discountCents: event.ticketPriceCents * QUANTITY,
          totalCents: 0,
          status: OrderStatus.PAID,
          paymentMethod: PaymentMethod.MANUAL,
          paymentProvider: "test",
          locale: "en",
          expiresAt: new Date("2026-10-31T20:00:00+01:00"),
          paidAt: new Date(),
          idempotencyKey: "test-tickets-ht26-001",
        },
      });

      for (const holderName of HOLDERS) {
        await tx.ticket.create({
          data: {
            token: generateTicketToken(),
            publicCode: generatePublicCode(),
            orderId: created.id,
            holderName,
            status: TicketStatus.VALID,
          },
        });
      }

      await tx.eventSettings.update({
        where: { id: "default" },
        data: { confirmedCount: { increment: QUANTITY } },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: created.id },
        include: { tickets: { orderBy: { createdAt: "asc" } } },
      });
    }));

  if (existing) {
    await prisma.checkIn.deleteMany({
      where: { ticketId: { in: existing.tickets.map((ticket) => ticket.id) } },
    });
    await prisma.ticket.updateMany({
      where: { orderId: existing.id },
      data: { status: TicketStatus.VALID, checkedInAt: null },
    });
  }

  const tickets = await prisma.ticket.findMany({
    where: { orderId: order.id },
    orderBy: { createdAt: "asc" },
  });

  const outDir = path.join(process.cwd(), "var", "test-tickets");
  await mkdir(outDir, { recursive: true });

  const cards = [];
  for (const ticket of tickets) {
    const qrFile = path.join(outDir, `${ticket.publicCode}.png`);
    await QRCode.toFile(qrFile, ticket.token, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 360,
      color: { dark: "#080808", light: "#F4EFE6" },
    });
    cards.push({ ticket, qrFile });
  }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>HT26 test tickets</title>
    <style>
      body { margin: 0; background: #080808; color: #f4efe6; font-family: sans-serif; }
      main { display: grid; gap: 32px; padding: 32px; max-width: 980px; margin: 0 auto; }
      article { border: 1px solid rgba(244,239,230,.12); padding: 24px; text-align: center; }
      img { width: 220px; background: #f4efe6; }
      h1 { font-weight: 500; }
      p { color: #9b8f86; }
      code { color: #f4efe6; }
    </style>
  </head>
  <body>
    <main>
      ${cards
        .map(
          ({ ticket }) => `
        <article>
          <h1>${ticket.holderName}</h1>
          <p>${ticket.publicCode}</p>
          <img src="${ticket.publicCode}.png" alt="${ticket.publicCode}" />
          <p><a href="${appUrl}/tickets/view/${ticket.token}" style="color:#d3142b">Open ticket</a></p>
        </article>`,
        )
        .join("")}
    </main>
  </body>
</html>`;
  await writeFile(path.join(outDir, "index.html"), html);

  console.log(`\n5 test tickets ready · order ${REFERENCE}\n`);
  for (const ticket of tickets) {
    console.log(`${ticket.holderName.padEnd(14)}  ${ticket.publicCode}  ${appUrl}/tickets/view/${ticket.token}`);
  }
  console.log(`\nQR sheet: ${path.join(outDir, "index.html")}\n`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

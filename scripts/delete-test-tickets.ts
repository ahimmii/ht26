import { rm } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const checkIns = await prisma.checkIn.deleteMany();
  const tickets = await prisma.ticket.deleteMany();
  const payments = await prisma.paymentEvent.deleteMany();
  const orders = await prisma.order.deleteMany();
  await prisma.eventSettings.update({
    where: { id: "default" },
    data: { reservedCount: 0, confirmedCount: 0 },
  });

  console.log(
    `Removed ${tickets.count} tickets, ${orders.count} orders, ${checkIns.count} check-ins, ${payments.count} payments. Inventory reset.`,
  );

  await rm(path.join(process.cwd(), "var", "test-tickets"), { recursive: true, force: true });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

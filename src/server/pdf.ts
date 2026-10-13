import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import type { EventSettings, Order, Ticket } from "@prisma/client";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { buildQrPayload } from "./tickets";

export async function buildTicketPdf(input: {
  order: Order;
  ticket: Ticket;
  event: EventSettings;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([420, 595]);
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);

  page.drawRectangle({
    x: 0,
    y: 0,
    width: 420,
    height: 595,
    color: rgb(0.03, 0.03, 0.03),
  });
  page.drawRectangle({
    x: 0,
    y: 560,
    width: 420,
    height: 8,
    color: rgb(0.63, 0, 0.08),
  });

  const logoBytes = await readFile(path.join(process.cwd(), "public", "logo.png"));
  const logo = await pdf.embedPng(logoBytes);
  page.drawImage(logo, { x: 36, y: 500, width: 220, height: 138 });
  page.drawText(input.event.title, {
    x: 36,
    y: 478,
    size: 12,
    font: bold,
    color: rgb(0.96, 0.94, 0.91),
  });
  page.drawText(formatDate(input.event.date), {
    x: 36,
    y: 458,
    size: 11,
    font,
    color: rgb(0.8, 0.76, 0.72),
  });
  page.drawText(`${input.event.venue} — ${input.event.city}`, {
    x: 36,
    y: 452,
    size: 11,
    font,
    color: rgb(0.8, 0.76, 0.72),
  });

  page.drawText("TICKET HOLDER", {
    x: 36,
    y: 410,
    size: 9,
    font: bold,
    color: rgb(0.63, 0, 0.08),
  });
  page.drawText(input.ticket.holderName, {
    x: 36,
    y: 392,
    size: 14,
    font,
    color: rgb(0.96, 0.94, 0.91),
  });
  page.drawText(`Order ${input.order.reference}`, {
    x: 36,
    y: 372,
    size: 11,
    font,
    color: rgb(0.8, 0.76, 0.72),
  });
  page.drawText(input.ticket.publicCode, {
    x: 36,
    y: 354,
    size: 12,
    font: bold,
    color: rgb(0.96, 0.94, 0.91),
  });
  page.drawText(formatMoney(input.order.unitPriceCents, input.event.currency), {
    x: 36,
    y: 336,
    size: 11,
    font,
    color: rgb(0.8, 0.76, 0.72),
  });

  const qrPng = await QRCode.toBuffer(buildQrPayload(input.ticket.token), {
    errorCorrectionLevel: "H",
    margin: 1,
    width: 220,
    color: { dark: "#080808", light: "#F5F0E8" },
  });
  const qrImage = await pdf.embedPng(qrPng);
  page.drawImage(qrImage, { x: 100, y: 90, width: 220, height: 220 });

  page.drawText("Valid for one entry only.", {
    x: 36,
    y: 48,
    size: 10,
    font,
    color: rgb(0.7, 0.66, 0.62),
  });

  return pdf.save();
}

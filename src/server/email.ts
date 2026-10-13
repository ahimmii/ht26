import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Order, Ticket } from "@prisma/client";
import nodemailer from "nodemailer";
import { getAppUrl, getSmtpConfig } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { getEventSettings } from "./event";
import { buildTicketPdf } from "./pdf";

function ticketUrl(token: string) {
  return `${getAppUrl()}/tickets/view/${token}`;
}

function renderTicketEmail(order: Order, tickets: Ticket[], eventTitle: string, eventDate: Date) {
  const ticketLinks = tickets
    .map(
      (ticket) =>
        `<li><a href="${ticketUrl(ticket.token)}">${ticket.publicCode}</a></li>`,
    )
    .join("");

  return `<!doctype html>
<html>
  <body style="background:#080808;color:#f5f0e8;font-family:Georgia,serif;padding:32px">
    <p style="letter-spacing:0.4em;color:#A00015;text-transform:uppercase">Halloween Tangier 2026</p>
    <h1 style="font-weight:400">${eventTitle}</h1>
    <p>${formatDate(eventDate, order.locale === "fr" ? "fr" : "en")}</p>
    <p>Order <strong>${order.reference}</strong> — ${formatMoney(order.totalCents)}</p>
    <p>${order.locale === "fr"
      ? "Vos billets numériques sont prêts. Chaque QR code n'est valable que pour une seule entrée."
      : "Your digital tickets are ready. Each QR code is valid for one entry only."}</p>
    <ul>${ticketLinks}</ul>
  </body>
</html>`;
}

export async function sendTicketEmail(order: Order, tickets: Ticket[]) {
  const event = await getEventSettings();
  const html = renderTicketEmail(order, tickets, event.title, event.date);
  const attachments = [];
  for (const ticket of tickets) {
    const pdf = await buildTicketPdf({ order, ticket, event });
    attachments.push({
      filename: `${ticket.publicCode}.pdf`,
      content: Buffer.from(pdf),
      contentType: "application/pdf",
    });
  }

  const smtp = getSmtpConfig();
  const payload = {
    to: order.email,
    subject: `${event.title} — ${order.reference}`,
    html,
    attachments: attachments.map((file) => file.filename),
  };

  if (!smtp) {
    const dir = path.join(process.cwd(), "var", "emails");
    await mkdir(dir, { recursive: true });
    await writeFile(
      path.join(dir, `${order.reference}.html`),
      `${html}\n<!-- SANDBOX ONLY: SMTP is not configured. PDF attachments: ${payload.attachments.join(", ")} -->`,
      "utf8",
    );
    for (const file of attachments) {
      await writeFile(path.join(dir, `${order.reference}-${file.filename}`), file.content);
    }
    return { delivered: false, sandbox: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.password },
  });

  await transporter.sendMail({
    from: smtp.from,
    to: order.email,
    subject: payload.subject,
    html,
    attachments,
  });

  return { delivered: true, sandbox: false };
}

export async function sendContactNotification(input: {
  name: string;
  email: string;
  message: string;
}) {
  const event = await getEventSettings();
  const smtp = getSmtpConfig();
  const html = `<p>${input.name} &lt;${input.email}&gt;</p><p>${input.message}</p>`;
  if (!smtp) {
    const dir = path.join(process.cwd(), "var", "emails");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, `contact-${Date.now()}.html`), html, "utf8");
    return;
  }
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.password },
  });
  await transporter.sendMail({
    from: smtp.from,
    to: event.contactEmail,
    replyTo: input.email,
    subject: `Contact — ${event.title}`,
    html,
  });
}

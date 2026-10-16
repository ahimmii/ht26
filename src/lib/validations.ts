import { z } from "zod";

export const localeSchema = z.enum(["en", "fr"]);

export const checkoutSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required")
    .max(80, "Name is too long"),
  email: z.string().trim().email("A valid email is required").max(160),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9\s.-]{8,20}$/, "Enter a valid phone number"),
  quantity: z.coerce.number().int().min(1).max(6),
  paymentMethod: z.enum(["MANUAL", "CMI", "STRIPE"]),
  promoCode: z.string().trim().max(40).optional().or(z.literal("")),
  acceptTerms: z.literal(true, {
    error: "You must accept the terms and refund policy",
  }),
  ambassadorCode: z.string().trim().max(40).optional(),
  utmSource: z.string().trim().max(80).optional(),
  utmMedium: z.string().trim().max(80).optional(),
  utmCampaign: z.string().trim().max(80).optional(),
  locale: localeSchema.default("en"),
  idempotencyKey: z.string().trim().max(80).optional(),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  message: z.string().trim().min(10).max(2000),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export const promoValidateSchema = z.object({
  code: z.string().trim().min(2).max(40),
  email: z.string().trim().email().optional(),
  quantity: z.coerce.number().int().min(1).max(6).optional(),
});

export const eventSettingsSchema = z.object({
  title: z.string().trim().min(2).max(120),
  titleFr: z.string().trim().min(2).max(120),
  tagline: z.string().trim().min(2).max(200),
  taglineFr: z.string().trim().min(2).max(200),
  date: z.string().min(1),
  venue: z.string().trim().min(2).max(160),
  venueFr: z.string().trim().min(2).max(160),
  address: z.string().trim().min(2).max(240),
  city: z.string().trim().min(2).max(80),
  country: z.string().trim().min(2).max(80),
  ticketPriceCents: z.coerce.number().int().min(0),
  currency: z.string().trim().min(3).max(8),
  capacity: z.coerce.number().int().min(1).max(10000),
  description: z.string().trim().min(10).max(8000),
  descriptionFr: z.string().trim().min(10).max(8000),
  posterUrl: z.string().trim().max(500).optional().or(z.literal("")),
  salesOpenAt: z.string().min(1),
  salesCloseAt: z.string().min(1),
  reservationMinutes: z.coerce.number().int().min(5).max(240),
  manualReservationHours: z.coerce.number().int().min(1).max(168),
  ageRestriction: z.coerce.number().int().min(16).max(25),
  bankName: z.string().trim().max(120).optional().or(z.literal("")),
  bankAccountName: z.string().trim().max(160).optional().or(z.literal("")),
  bankIban: z.string().trim().max(64).optional().or(z.literal("")),
  bankReferenceHint: z.string().trim().max(200).optional().or(z.literal("")),
  contactEmail: z.string().trim().email(),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  instagramUrl: z.string().trim().max(200).optional().or(z.literal("")),
  tiktokUrl: z.string().trim().max(200).optional().or(z.literal("")),
  metaPixelId: z.string().trim().max(40).optional().or(z.literal("")),
  gaMeasurementId: z.string().trim().max(40).optional().or(z.literal("")),
});

export const promoCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3)
    .max(40)
    .transform((value) => value.toUpperCase()),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.coerce.number().int().min(1),
  expiresAt: z.string().optional().or(z.literal("")),
  usageLimit: z.coerce.number().int().min(1).optional().or(z.literal("")),
  perCustomerLimit: z.coerce.number().int().min(1).max(20).default(1),
  active: z.coerce.boolean().default(true),
});

export const scanSchema = z.object({
  token: z.string().trim().min(8).max(200).optional(),
  publicCode: z.string().trim().min(4).max(20).optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type EventSettingsInput = z.infer<typeof eventSettingsSchema>;

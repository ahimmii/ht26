import "server-only";

function optional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function required(name: string, fallback?: string): string {
  const value = optional(name) ?? fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAppUrl() {
  return (
    optional("APP_URL") ??
    optional("AUTH_URL") ??
    optional("NEXTAUTH_URL") ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function getAuthSecret() {
  return required("AUTH_SECRET", optional("NEXTAUTH_SECRET"));
}

export function isCmiConfigured() {
  return (
    optional("CMI_ENABLED") === "true" &&
    Boolean(optional("CMI_CLIENT_ID")) &&
    Boolean(optional("CMI_STORE_KEY")) &&
    Boolean(optional("CMI_GATEWAY_URL"))
  );
}

export function getCmiConfig() {
  if (!isCmiConfigured()) return null;
  return {
    clientId: required("CMI_CLIENT_ID"),
    storeKey: required("CMI_STORE_KEY"),
    gatewayUrl: required("CMI_GATEWAY_URL"),
    storeType: optional("CMI_STORE_TYPE") ?? "3D_PAY_HOSTING",
    hashAlgorithm: optional("CMI_HASH_ALGORITHM") ?? "SHA512",
    currency: optional("CMI_CURRENCY") ?? "504",
  };
}

export function isStripeConfigured() {
  return Boolean(optional("STRIPE_SECRET_KEY") && optional("STRIPE_WEBHOOK_SECRET"));
}

export function getStripeConfig() {
  if (!isStripeConfigured()) return null;
  return {
    secretKey: required("STRIPE_SECRET_KEY"),
    webhookSecret: required("STRIPE_WEBHOOK_SECRET"),
  };
}

export function getSmtpConfig() {
  const host = optional("SMTP_HOST");
  const user = optional("SMTP_USER");
  const password = optional("SMTP_PASSWORD");
  if (!host || !user || !password) return null;
  return {
    host,
    port: Number(optional("SMTP_PORT") ?? "587"),
    secure: optional("SMTP_SECURE") === "true",
    user,
    password,
    from: optional("SMTP_FROM") ?? "Halloween Tangier <tickets@localhost>",
  };
}

export function getCronSecret() {
  return optional("CRON_SECRET");
}

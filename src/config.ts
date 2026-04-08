export type AppConfig = {
  nodeEnv: "development" | "test" | "production";
  host: string;
  port: number;
  publicAppUrl: string;

  databaseUrl: string;

  stripe: {
    secretKey: string;
    webhookSecret: string;
    priceAccountsFiling: string;
    priceConfirmationStatement: string;
    priceStrikeOff: string;
  };

  companiesHouse: {
    apiKey: string;
    baseUrl: string;
  };
};

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback;
}

function asPort(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid ${name}: ${value}`);
  }
  return parsed;
}

function assertPrefix(name: string, value: string, prefix: string) {
  if (!value.startsWith(prefix)) {
    throw new Error(`${name} must start with "${prefix}"`);
  }
}

function assertNodeEnv(value: string): asserts value is AppConfig["nodeEnv"] {
  if (!["development", "test", "production"].includes(value)) {
    throw new Error(`NODE_ENV must be development, test, or production. Got: ${value}`);
  }
}

const nodeEnvRaw = optional("NODE_ENV", "development");
assertNodeEnv(nodeEnvRaw);

const stripeSecretKey = required("STRIPE_SECRET_KEY");
const stripeWebhookSecret = required("STRIPE_WEBHOOK_SECRET");
const stripePriceAccountsFiling = required("STRIPE_PRICE_ACCOUNTS_FILING");
const stripePriceConfirmationStatement = required("STRIPE_PRICE_CONFIRMATION_STATEMENT");
const stripePriceStrikeOff = required("STRIPE_PRICE_STRIKE_OFF");
const companiesHouseApiKey = required("COMPANIES_HOUSE_API_KEY");

assertPrefix("STRIPE_SECRET_KEY", stripeSecretKey, "sk_");
assertPrefix("STRIPE_WEBHOOK_SECRET", stripeWebhookSecret, "whsec_");
assertPrefix("STRIPE_PRICE_ACCOUNTS_FILING", stripePriceAccountsFiling, "price_");
assertPrefix("STRIPE_PRICE_CONFIRMATION_STATEMENT", stripePriceConfirmationStatement, "price_");
assertPrefix("STRIPE_PRICE_STRIKE_OFF", stripePriceStrikeOff, "price_");

export const config: AppConfig = {
  nodeEnv: nodeEnvRaw,
  host: optional("HOST", "0.0.0.0"),
  port: asPort(optional("PORT", optional("WEBSITES_PORT", "8080")), "PORT"),
  publicAppUrl: optional("PUBLIC_APP_URL", optional("APP_URL", "http://localhost:3000")),

  databaseUrl: required("DATABASE_URL"),

  stripe: {
    secretKey: stripeSecretKey,
    webhookSecret: stripeWebhookSecret,
    priceAccountsFiling: stripePriceAccountsFiling,
    priceConfirmationStatement: stripePriceConfirmationStatement,
    priceStrikeOff: stripePriceStrikeOff,
  },

  companiesHouse: {
    apiKey: companiesHouseApiKey,
    baseUrl: optional(
      "COMPANIES_HOUSE_BASE_URL",
      "https://api.company-information.service.gov.uk",
    ),
  },
};

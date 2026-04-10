import { z } from "zod/v4"

/**
 * Validated environment variables.
 * Importing this module will throw at startup if any required env var is missing or invalid.
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),

  // Redis
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),

  // Auth
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_URL: z.url("AUTH_URL must be a valid URL").optional(),

  // Google OAuth
  AUTH_GOOGLE_ID: z.string().min(1, "AUTH_GOOGLE_ID is required"),
  AUTH_GOOGLE_SECRET: z.string().min(1, "AUTH_GOOGLE_SECRET is required"),

  // Encryption
  ENCRYPTION_KEY: z.string().length(64, "ENCRYPTION_KEY must be 64 hex characters").regex(/^[0-9a-fA-F]+$/, "ENCRYPTION_KEY must be hex"),

  // Node environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  // Allowed hosts for reverse proxy (comma-separated)
  ALLOWED_HOSTS: z.string().optional(),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ✗ ${i.path.join(".")}: ${i.message}`)
      .join("\n")
    console.error("❌ Invalid environment variables:\n" + formatted)
    throw new Error("Invalid environment variables")
  }
  return result.data
}

export const env = validateEnv()

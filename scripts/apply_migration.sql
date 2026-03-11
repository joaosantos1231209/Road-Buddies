-- Add email verification fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_email_verified" boolean DEFAULT false NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_token" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "verification_token_expiry" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_admin" boolean DEFAULT false NOT NULL;
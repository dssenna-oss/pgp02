-- Add isActive column to users table
ALTER TABLE "users" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT false;

-- Activate the admin user
UPDATE "users" SET "isActive" = true WHERE email = 'clubedoservidor@protonmail.com';

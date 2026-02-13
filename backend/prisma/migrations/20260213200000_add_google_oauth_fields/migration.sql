-- AlterTable: make password_hash nullable for Google OAuth users
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;

-- AlterTable: add google_id and auth_provider columns
ALTER TABLE "users" ADD COLUMN "google_id" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN "auth_provider" VARCHAR(20) NOT NULL DEFAULT 'email';

-- CreateIndex: unique constraint on google_id
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

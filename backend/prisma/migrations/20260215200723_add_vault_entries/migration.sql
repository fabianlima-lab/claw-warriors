-- CreateTable
CREATE TABLE "vault_entries" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "encrypted_value" TEXT NOT NULL,
    "iv" VARCHAR(32) NOT NULL,
    "auth_tag" VARCHAR(32) NOT NULL,
    "masked_preview" VARCHAR(20) NOT NULL,
    "expires_at" TIMESTAMP(3),
    "last_used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vault_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vault_entries_user_id_idx" ON "vault_entries"("user_id");

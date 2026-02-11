-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "tier" VARCHAR(20) NOT NULL DEFAULT 'free',
    "channel" VARCHAR(20),
    "channel_id" VARCHAR(255),
    "goals" TEXT[],
    "stripe_customer_id" VARCHAR(255),
    "stripe_subscription_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warriors" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "template_id" VARCHAR(50) NOT NULL,
    "custom_name" VARCHAR(100),
    "class" VARCHAR(20) NOT NULL,
    "tone" VARCHAR(20) NOT NULL DEFAULT 'casual',
    "model_default" VARCHAR(50) NOT NULL,
    "model_escalation" VARCHAR(50),
    "system_prompt" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warriors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "energy" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "monthly_allocation" INTEGER NOT NULL DEFAULT 0,
    "used_this_month" INTEGER NOT NULL DEFAULT 0,
    "immortal_active" BOOLEAN NOT NULL DEFAULT false,
    "immortal_expires" TIMESTAMP(3),
    "reset_date" TIMESTAMP(3) NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "warrior_id" UUID,
    "direction" VARCHAR(10) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "model_used" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "elixir_purchases" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "energy_added" INTEGER,
    "price_paid" DECIMAL(10,2) NOT NULL,
    "stripe_payment_id" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "elixir_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warrior_templates" (
    "id" VARCHAR(50) NOT NULL,
    "class" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "gender" VARCHAR(10) NOT NULL,
    "intro_quote" TEXT NOT NULL,
    "first_message" TEXT NOT NULL,
    "base_system_prompt" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    "recommended_tier" VARCHAR(20) NOT NULL,
    "recommended_channel" VARCHAR(20) NOT NULL,
    "model_default" VARCHAR(50) NOT NULL,
    "model_escalation" VARCHAR(50),
    "art_file" VARCHAR(255) NOT NULL,

    CONSTRAINT "warrior_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "energy_user_id_key" ON "energy"("user_id");

-- CreateIndex
CREATE INDEX "messages_user_id_idx" ON "messages"("user_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- AddForeignKey
ALTER TABLE "warriors" ADD CONSTRAINT "warriors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warriors" ADD CONSTRAINT "warriors_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "warrior_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "energy" ADD CONSTRAINT "energy_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_warrior_id_fkey" FOREIGN KEY ("warrior_id") REFERENCES "warriors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "elixir_purchases" ADD CONSTRAINT "elixir_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

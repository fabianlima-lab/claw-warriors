-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "tier" VARCHAR(20) NOT NULL DEFAULT 'trial',
    "trial_ends_at" TIMESTAMP(3),
    "channel" VARCHAR(20),
    "channel_id" VARCHAR(255),
    "channel_2" VARCHAR(20),
    "channel_2_id" VARCHAR(255),
    "goals" TEXT,
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
    "warrior_class" VARCHAR(20) NOT NULL,
    "tone" VARCHAR(20) NOT NULL DEFAULT 'casual',
    "system_prompt" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warriors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "warrior_id" VARCHAR(50) NOT NULL,
    "direction" VARCHAR(10) NOT NULL,
    "channel" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warrior_templates" (
    "id" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "warrior_class" VARCHAR(20) NOT NULL,
    "gender" VARCHAR(10) NOT NULL,
    "intro_quote" TEXT NOT NULL,
    "first_message" TEXT NOT NULL,
    "base_system_prompt" TEXT NOT NULL,
    "stats" JSONB NOT NULL,
    "recommended_tier" VARCHAR(20) NOT NULL,
    "art_file" VARCHAR(255) NOT NULL,

    CONSTRAINT "warrior_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "warriors_user_id_idx" ON "warriors"("user_id");

-- CreateIndex
CREATE INDEX "messages_user_id_created_at_idx" ON "messages"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "warriors" ADD CONSTRAINT "warriors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warriors" ADD CONSTRAINT "warriors_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "warrior_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

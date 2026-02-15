-- AlterTable
ALTER TABLE "users" ADD COLUMN     "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/New_York';

-- AlterTable
ALTER TABLE "warriors" ADD COLUMN     "soul_config" TEXT;

-- CreateTable
CREATE TABLE "warrior_memories" (
    "id" UUID NOT NULL,
    "warrior_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "content" TEXT NOT NULL,
    "source" VARCHAR(20) NOT NULL DEFAULT 'extracted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warrior_memories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pulse_checks" (
    "id" UUID NOT NULL,
    "warrior_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "prompt" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "hour" INTEGER NOT NULL DEFAULT 8,
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pulse_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "war_rhythms" (
    "id" UUID NOT NULL,
    "warrior_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "task_prompt" TEXT NOT NULL,
    "cron_expr" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "last_result" TEXT,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'America/New_York',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "war_rhythms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warrior_memories_warrior_id_category_idx" ON "warrior_memories"("warrior_id", "category");

-- CreateIndex
CREATE INDEX "warrior_memories_user_id_created_at_idx" ON "warrior_memories"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "pulse_checks_is_active_idx" ON "pulse_checks"("is_active");

-- CreateIndex
CREATE INDEX "pulse_checks_warrior_id_idx" ON "pulse_checks"("warrior_id");

-- CreateIndex
CREATE INDEX "war_rhythms_is_active_next_run_at_idx" ON "war_rhythms"("is_active", "next_run_at");

-- CreateIndex
CREATE INDEX "war_rhythms_warrior_id_idx" ON "war_rhythms"("warrior_id");

-- AddForeignKey
ALTER TABLE "warrior_memories" ADD CONSTRAINT "warrior_memories_warrior_id_fkey" FOREIGN KEY ("warrior_id") REFERENCES "warriors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pulse_checks" ADD CONSTRAINT "pulse_checks_warrior_id_fkey" FOREIGN KEY ("warrior_id") REFERENCES "warriors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "war_rhythms" ADD CONSTRAINT "war_rhythms_warrior_id_fkey" FOREIGN KEY ("warrior_id") REFERENCES "warriors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

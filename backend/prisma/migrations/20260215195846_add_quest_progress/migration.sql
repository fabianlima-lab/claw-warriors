-- CreateTable
CREATE TABLE "quest_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "quest_id" VARCHAR(50) NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quest_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quest_progress_user_id_idx" ON "quest_progress"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "quest_progress_user_id_quest_id_key" ON "quest_progress"("user_id", "quest_id");

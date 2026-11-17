-- CreateEnum
CREATE TYPE "ExerciseModerationAction" AS ENUM ('SAFETY_SUSPENSION', 'SAFETY_REINSTATEMENT');

-- CreateEnum
CREATE TYPE "ExerciseModerationStatus" AS ENUM ('OPEN', 'RESOLVED');

-- CreateTable
CREATE TABLE "ExerciseModeration" (
    "id" UUID NOT NULL,
    "exerciseVariationId" UUID NOT NULL,
    "moderatorId" UUID NOT NULL,
    "action" "ExerciseModerationAction" NOT NULL,
    "status" "ExerciseModerationStatus" NOT NULL DEFAULT 'OPEN',
    "reason" TEXT NOT NULL,
    "scientificReferences" TEXT,
    "previousStatus" "ExerciseStatus" NOT NULL,
    "newStatus" "ExerciseStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ExerciseModeration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseModeration_exerciseVariationId_idx" ON "ExerciseModeration"("exerciseVariationId");

-- CreateIndex
CREATE INDEX "ExerciseModeration_moderatorId_idx" ON "ExerciseModeration"("moderatorId");

-- CreateIndex
CREATE INDEX "ExerciseModeration_status_idx" ON "ExerciseModeration"("status");

-- CreateIndex
CREATE INDEX "ExerciseModeration_createdAt_idx" ON "ExerciseModeration"("createdAt");

-- AddForeignKey
ALTER TABLE "ExerciseModeration" ADD CONSTRAINT "ExerciseModeration_exerciseVariationId_fkey" FOREIGN KEY ("exerciseVariationId") REFERENCES "ExerciseVariation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseModeration" ADD CONSTRAINT "ExerciseModeration_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

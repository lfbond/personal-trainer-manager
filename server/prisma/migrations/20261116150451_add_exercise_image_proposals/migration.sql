-- CreateEnum
CREATE TYPE "ExerciseImageProposalAction" AS ENUM ('ADD', 'REPLACE', 'REMOVE');

-- CreateEnum
CREATE TYPE "ExerciseImageProposalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "canApproveExerciseImages" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canManageExerciseImages" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canProposeExerciseImages" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ExerciseImageProposal" (
    "id" UUID NOT NULL,
    "exerciseVariationId" UUID NOT NULL,
    "proposedById" UUID NOT NULL,
    "reviewedById" UUID,
    "action" "ExerciseImageProposalAction" NOT NULL,
    "proposedImageUrl" TEXT,
    "previousImageUrl" TEXT,
    "status" "ExerciseImageProposalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "ExerciseImageProposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ExerciseImageProposal_exerciseVariationId_status_idx" ON "ExerciseImageProposal"("exerciseVariationId", "status");

-- CreateIndex
CREATE INDEX "ExerciseImageProposal_proposedById_idx" ON "ExerciseImageProposal"("proposedById");

-- CreateIndex
CREATE INDEX "ExerciseImageProposal_status_createdAt_idx" ON "ExerciseImageProposal"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "ExerciseImageProposal" ADD CONSTRAINT "ExerciseImageProposal_exerciseVariationId_fkey" FOREIGN KEY ("exerciseVariationId") REFERENCES "ExerciseVariation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseImageProposal" ADD CONSTRAINT "ExerciseImageProposal_proposedById_fkey" FOREIGN KEY ("proposedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseImageProposal" ADD CONSTRAINT "ExerciseImageProposal_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

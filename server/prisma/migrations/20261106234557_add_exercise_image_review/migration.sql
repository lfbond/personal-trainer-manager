-- CreateEnum
CREATE TYPE "ExerciseImageStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "ExerciseVariation" ADD COLUMN     "imageReviewNotes" TEXT,
ADD COLUMN     "imageReviewStatus" "ExerciseImageStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "imageReviewedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "ExerciseVariation_imageReviewStatus_idx" ON "ExerciseVariation"("imageReviewStatus");

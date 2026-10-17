-- CreateEnum
CREATE TYPE "OrganizationRole" AS ENUM ('OWNER', 'ADMIN', 'TRAINER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TRAINER', 'STUDENT');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AnamnesisStatus" AS ENUM ('DRAFT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ScreeningStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ScreeningAnswerType" AS ENUM ('YES_NO', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TEXT', 'NUMBER', 'DATE');

-- CreateEnum
CREATE TYPE "RestrictionType" AS ENUM ('JOINT', 'MUSCULAR', 'BONE', 'CARDIOVASCULAR', 'RESPIRATORY', 'NEUROLOGICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "BodyRegion" AS ENUM ('NECK', 'SHOULDER', 'ELBOW', 'WRIST', 'HAND', 'SPINE', 'HIP', 'KNEE', 'ANKLE', 'FOOT', 'CHEST', 'OTHER');

-- CreateEnum
CREATE TYPE "ExerciseCategory" AS ENUM ('MACHINE_CABLE', 'FREE_WEIGHT');

-- CreateEnum
CREATE TYPE "ExerciseLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "MuscleGroup" AS ENUM ('CHEST', 'BACK', 'SHOULDERS', 'BICEPS', 'TRICEPS', 'LEGS', 'GLUTES', 'CALVES', 'CORE', 'CARDIO', 'FULL_BODY', 'OTHER');

-- CreateEnum
CREATE TYPE "MuscleRole" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "ExerciseStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WorkoutStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "WeightUnit" AS ENUM ('KG', 'LB');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('HYPERTROPHY', 'WEIGHT_LOSS', 'STRENGTH', 'MUSCULAR_ENDURANCE', 'CARDIOVASCULAR_CONDITIONING', 'MOBILITY', 'FLEXIBILITY', 'GENERAL_HEALTH', 'SPORTS_PERFORMANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalPriority" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('DRAFT', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SkinfoldSite" AS ENUM ('BICEPS', 'TRICEPS', 'SUBSCAPULAR', 'SUPRAILIAC', 'SUPRASPINALE', 'ABDOMINAL', 'CHEST', 'MIDAXILLARY', 'THIGH', 'CALF', 'OTHER');

-- CreateEnum
CREATE TYPE "BodySide" AS ENUM ('LEFT', 'RIGHT');

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "OrganizationRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trainer" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "userId" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "birthDate" DATE,
    "notes" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "organizationId" UUID NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentScreening" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "questionnaireCode" TEXT NOT NULL,
    "questionnaireName" TEXT NOT NULL,
    "questionnaireVersion" TEXT NOT NULL,
    "status" "ScreeningStatus" NOT NULL DEFAULT 'DRAFT',
    "respondedByUserId" UUID,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "professionalNotes" TEXT,
    "followUpRequired" BOOLEAN,
    "followUpNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentScreening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScreeningAnswer" (
    "id" UUID NOT NULL,
    "screeningId" UUID NOT NULL,
    "questionCode" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "answerType" "ScreeningAnswerType" NOT NULL,
    "answerValue" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScreeningAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentInvitation" (
    "id" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentHealthProfile" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "usesMedication" BOOLEAN,
    "medicationNotes" TEXT,
    "medicalClearance" BOOLEAN,
    "clearanceNotes" TEXT,
    "generalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentHealthProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentRestriction" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "type" "RestrictionType" NOT NULL,
    "bodyRegion" "BodyRegion" NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentRestriction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentAnamnesis" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" "AnamnesisStatus" NOT NULL DEFAULT 'DRAFT',
    "occupation" TEXT,
    "workRoutine" TEXT,
    "sleepHours" DECIMAL(4,1),
    "sleepQuality" TEXT,
    "stressLevel" TEXT,
    "physicalActivityHistory" TEXT,
    "currentActivities" TEXT,
    "weeklyFrequency" INTEGER,
    "availableTrainingDays" INTEGER,
    "preferredTrainingTime" TEXT,
    "smokingStatus" TEXT,
    "alcoholConsumption" TEXT,
    "generalLifestyleNotes" TEXT,
    "healthHistory" TEXT,
    "familyHealthHistory" TEXT,
    "previousSurgeries" TEXT,
    "currentSymptoms" TEXT,
    "painDescription" TEXT,
    "medicalFollowUpNotes" TEXT,
    "studentDeclarations" TEXT,
    "professionalNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentAnamnesis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGoal" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "type" "GoalType" NOT NULL,
    "priority" "GoalPriority" NOT NULL DEFAULT 'PRIMARY',
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "targetDate" DATE,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "muscleGroup" "MuscleGroup" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseVariation" (
    "id" UUID NOT NULL,
    "exerciseId" UUID NOT NULL,
    "trainerId" UUID,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ExerciseCategory" NOT NULL,
    "level" "ExerciseLevel" NOT NULL,
    "equipment" TEXT,
    "subgroup" TEXT,
    "description" TEXT,
    "instructions" TEXT,
    "safetyNotes" TEXT,
    "muscleExplanation" TEXT,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "status" "ExerciseStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseVariation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Muscle" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Muscle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseMuscle" (
    "id" UUID NOT NULL,
    "exerciseVariationId" UUID NOT NULL,
    "muscleId" UUID NOT NULL,
    "role" "MuscleRole" NOT NULL,
    "explanation" TEXT,

    CONSTRAINT "ExerciseMuscle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "previousWorkoutId" UUID,
    "version" INTEGER NOT NULL DEFAULT 1,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "WorkoutStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutExercise" (
    "id" UUID NOT NULL,
    "workoutId" UUID NOT NULL,
    "exerciseVariationId" UUID NOT NULL,
    "sets" INTEGER NOT NULL,
    "repetitions" TEXT NOT NULL,
    "weight" DECIMAL(8,2),
    "weightUnit" "WeightUnit" NOT NULL DEFAULT 'KG',
    "restSeconds" INTEGER,
    "order" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "exerciseNameSnapshot" TEXT,
    "exerciseInstructionsSnapshot" TEXT,
    "exerciseSafetyNotesSnapshot" TEXT,

    CONSTRAINT "WorkoutExercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhysicalAssessment" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "trainerId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'DRAFT',
    "assessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "generalNotes" TEXT,
    "professionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PhysicalAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAnthropometry" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "weightKg" DECIMAL(6,2),
    "heightCm" DECIMAL(5,2),
    "neckCm" DECIMAL(5,2),
    "shoulderCm" DECIMAL(5,2),
    "chestCm" DECIMAL(5,2),
    "waistCm" DECIMAL(5,2),
    "abdomenCm" DECIMAL(5,2),
    "hipCm" DECIMAL(5,2),
    "rightArmCm" DECIMAL(5,2),
    "leftArmCm" DECIMAL(5,2),
    "rightForearmCm" DECIMAL(5,2),
    "leftForearmCm" DECIMAL(5,2),
    "rightThighCm" DECIMAL(5,2),
    "leftThighCm" DECIMAL(5,2),
    "rightCalfCm" DECIMAL(5,2),
    "leftCalfCm" DECIMAL(5,2),
    "measurementProtocol" TEXT,
    "equipmentNotes" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAnthropometry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentSkinfold" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "protocolCode" TEXT,
    "protocolName" TEXT,
    "protocolVersion" TEXT,
    "caliperBrand" TEXT,
    "caliperModel" TEXT,
    "equipmentNotes" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentSkinfold_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkinfoldMeasurement" (
    "id" UUID NOT NULL,
    "skinfoldId" UUID NOT NULL,
    "site" "SkinfoldSite" NOT NULL,
    "side" "BodySide" NOT NULL DEFAULT 'RIGHT',
    "valueMm" DECIMAL(5,2) NOT NULL,
    "measurementOrder" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkinfoldMeasurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentBioimpedance" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "deviceBrand" TEXT,
    "deviceModel" TEXT,
    "deviceSerial" TEXT,
    "deviceNotes" TEXT,
    "measurementTime" TIMESTAMP(3),
    "fastingHours" DECIMAL(4,1),
    "recentExercise" BOOLEAN,
    "recentMeal" BOOLEAN,
    "recentAlcohol" BOOLEAN,
    "hydrationNotes" TEXT,
    "preparationNotes" TEXT,
    "bodyFatPercent" DECIMAL(5,2),
    "fatMassKg" DECIMAL(6,2),
    "fatFreeMassKg" DECIMAL(6,2),
    "skeletalMuscleKg" DECIMAL(6,2),
    "totalBodyWaterKg" DECIMAL(6,2),
    "totalBodyWaterPct" DECIMAL(5,2),
    "visceralFatIndex" DECIMAL(6,2),
    "resistanceOhms" DECIMAL(8,2),
    "reactanceOhms" DECIMAL(8,2),
    "frequencyKhz" DECIMAL(8,2),
    "deviceAlgorithmVersion" TEXT,
    "reportReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentBioimpedance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_organizationId_userId_key" ON "OrganizationMember"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Trainer_userId_key" ON "Trainer"("userId");

-- CreateIndex
CREATE INDEX "Student_trainerId_idx" ON "Student"("trainerId");

-- CreateIndex
CREATE INDEX "Student_status_idx" ON "Student"("status");

-- CreateIndex
CREATE INDEX "Student_organizationId_idx" ON "Student"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_organizationId_userId_key" ON "Student"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "StudentScreening_studentId_createdAt_idx" ON "StudentScreening"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "StudentScreening_questionnaireCode_questionnaireVersion_idx" ON "StudentScreening"("questionnaireCode", "questionnaireVersion");

-- CreateIndex
CREATE INDEX "StudentScreening_status_idx" ON "StudentScreening"("status");

-- CreateIndex
CREATE INDEX "ScreeningAnswer_screeningId_idx" ON "ScreeningAnswer"("screeningId");

-- CreateIndex
CREATE UNIQUE INDEX "ScreeningAnswer_screeningId_questionCode_key" ON "ScreeningAnswer"("screeningId", "questionCode");

-- CreateIndex
CREATE UNIQUE INDEX "StudentInvitation_tokenHash_key" ON "StudentInvitation"("tokenHash");

-- CreateIndex
CREATE INDEX "StudentInvitation_trainerId_idx" ON "StudentInvitation"("trainerId");

-- CreateIndex
CREATE INDEX "StudentInvitation_studentId_idx" ON "StudentInvitation"("studentId");

-- CreateIndex
CREATE INDEX "StudentInvitation_expiresAt_idx" ON "StudentInvitation"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "StudentHealthProfile_studentId_key" ON "StudentHealthProfile"("studentId");

-- CreateIndex
CREATE INDEX "StudentRestriction_studentId_idx" ON "StudentRestriction"("studentId");

-- CreateIndex
CREATE INDEX "StudentAnamnesis_studentId_idx" ON "StudentAnamnesis"("studentId");

-- CreateIndex
CREATE INDEX "StudentAnamnesis_studentId_createdAt_idx" ON "StudentAnamnesis"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "StudentAnamnesis_status_idx" ON "StudentAnamnesis"("status");

-- CreateIndex
CREATE INDEX "StudentGoal_studentId_idx" ON "StudentGoal"("studentId");

-- CreateIndex
CREATE INDEX "StudentGoal_status_idx" ON "StudentGoal"("status");

-- CreateIndex
CREATE INDEX "StudentGoal_studentId_status_idx" ON "StudentGoal"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Exercise_code_key" ON "Exercise"("code");

-- CreateIndex
CREATE INDEX "Exercise_muscleGroup_idx" ON "Exercise"("muscleGroup");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseVariation_code_key" ON "ExerciseVariation"("code");

-- CreateIndex
CREATE INDEX "ExerciseVariation_exerciseId_idx" ON "ExerciseVariation"("exerciseId");

-- CreateIndex
CREATE INDEX "ExerciseVariation_trainerId_idx" ON "ExerciseVariation"("trainerId");

-- CreateIndex
CREATE INDEX "ExerciseVariation_category_level_idx" ON "ExerciseVariation"("category", "level");

-- CreateIndex
CREATE INDEX "ExerciseVariation_status_idx" ON "ExerciseVariation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Muscle_code_key" ON "Muscle"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Muscle_name_key" ON "Muscle"("name");

-- CreateIndex
CREATE INDEX "ExerciseMuscle_muscleId_idx" ON "ExerciseMuscle"("muscleId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseMuscle_exerciseVariationId_muscleId_key" ON "ExerciseMuscle"("exerciseVariationId", "muscleId");

-- CreateIndex
CREATE INDEX "Workout_trainerId_idx" ON "Workout"("trainerId");

-- CreateIndex
CREATE INDEX "Workout_studentId_idx" ON "Workout"("studentId");

-- CreateIndex
CREATE INDEX "Workout_status_idx" ON "Workout"("status");

-- CreateIndex
CREATE INDEX "Workout_previousWorkoutId_idx" ON "Workout"("previousWorkoutId");

-- CreateIndex
CREATE INDEX "Workout_organizationId_idx" ON "Workout"("organizationId");

-- CreateIndex
CREATE INDEX "WorkoutExercise_workoutId_idx" ON "WorkoutExercise"("workoutId");

-- CreateIndex
CREATE INDEX "WorkoutExercise_exerciseVariationId_idx" ON "WorkoutExercise"("exerciseVariationId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutExercise_workoutId_order_key" ON "WorkoutExercise"("workoutId", "order");

-- CreateIndex
CREATE INDEX "PhysicalAssessment_studentId_assessedAt_idx" ON "PhysicalAssessment"("studentId", "assessedAt");

-- CreateIndex
CREATE INDEX "PhysicalAssessment_trainerId_idx" ON "PhysicalAssessment"("trainerId");

-- CreateIndex
CREATE INDEX "PhysicalAssessment_organizationId_idx" ON "PhysicalAssessment"("organizationId");

-- CreateIndex
CREATE INDEX "PhysicalAssessment_status_idx" ON "PhysicalAssessment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAnthropometry_assessmentId_key" ON "AssessmentAnthropometry"("assessmentId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentSkinfold_assessmentId_key" ON "AssessmentSkinfold"("assessmentId");

-- CreateIndex
CREATE INDEX "SkinfoldMeasurement_skinfoldId_idx" ON "SkinfoldMeasurement"("skinfoldId");

-- CreateIndex
CREATE UNIQUE INDEX "SkinfoldMeasurement_skinfoldId_site_side_measurementOrder_key" ON "SkinfoldMeasurement"("skinfoldId", "site", "side", "measurementOrder");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentBioimpedance_assessmentId_key" ON "AssessmentBioimpedance"("assessmentId");

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trainer" ADD CONSTRAINT "Trainer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScreening" ADD CONSTRAINT "StudentScreening_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScreeningAnswer" ADD CONSTRAINT "ScreeningAnswer_screeningId_fkey" FOREIGN KEY ("screeningId") REFERENCES "StudentScreening"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInvitation" ADD CONSTRAINT "StudentInvitation_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentInvitation" ADD CONSTRAINT "StudentInvitation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentHealthProfile" ADD CONSTRAINT "StudentHealthProfile_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentRestriction" ADD CONSTRAINT "StudentRestriction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentAnamnesis" ADD CONSTRAINT "StudentAnamnesis_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGoal" ADD CONSTRAINT "StudentGoal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseVariation" ADD CONSTRAINT "ExerciseVariation_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseVariation" ADD CONSTRAINT "ExerciseVariation_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseMuscle" ADD CONSTRAINT "ExerciseMuscle_exerciseVariationId_fkey" FOREIGN KEY ("exerciseVariationId") REFERENCES "ExerciseVariation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseMuscle" ADD CONSTRAINT "ExerciseMuscle_muscleId_fkey" FOREIGN KEY ("muscleId") REFERENCES "Muscle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_previousWorkoutId_fkey" FOREIGN KEY ("previousWorkoutId") REFERENCES "Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutExercise" ADD CONSTRAINT "WorkoutExercise_exerciseVariationId_fkey" FOREIGN KEY ("exerciseVariationId") REFERENCES "ExerciseVariation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalAssessment" ADD CONSTRAINT "PhysicalAssessment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalAssessment" ADD CONSTRAINT "PhysicalAssessment_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES "Trainer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhysicalAssessment" ADD CONSTRAINT "PhysicalAssessment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAnthropometry" ADD CONSTRAINT "AssessmentAnthropometry_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "PhysicalAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentSkinfold" ADD CONSTRAINT "AssessmentSkinfold_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "PhysicalAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkinfoldMeasurement" ADD CONSTRAINT "SkinfoldMeasurement_skinfoldId_fkey" FOREIGN KEY ("skinfoldId") REFERENCES "AssessmentSkinfold"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentBioimpedance" ADD CONSTRAINT "AssessmentBioimpedance_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "PhysicalAssessment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

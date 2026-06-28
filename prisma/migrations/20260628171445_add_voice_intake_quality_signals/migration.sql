ALTER TABLE "VoiceIntake"
ADD COLUMN "transcriptConfidence" DOUBLE PRECISION,
ADD COLUMN "qualityFlags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "students" ADD COLUMN     "trackHeight" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "body_records" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DECIMAL(5,2),
    "height" DECIMAL(5,2),
    "waist" DECIMAL(5,2),
    "abdomen" DECIMAL(5,2),
    "arms" DECIMAL(5,2),
    "legs" DECIMAL(5,2),
    "glutes" DECIMAL(5,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "body_records_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "body_records" ADD CONSTRAINT "body_records_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

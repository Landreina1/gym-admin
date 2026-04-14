-- AlterTable
ALTER TABLE "students" ADD COLUMN     "abdomen" DECIMAL(5,2),
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "arms" DECIMAL(5,2),
ADD COLUMN     "glutes" DECIMAL(5,2),
ADD COLUMN     "isCeliac" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "legs" DECIMAL(5,2),
ADD COLUMN     "waist" DECIMAL(5,2);

-- CreateTable
CREATE TABLE "diet_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "meals" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diet_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_diets" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "templateId" TEXT,
    "name" TEXT NOT NULL,
    "meals" JSONB NOT NULL,
    "notes" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_diets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_diets_studentId_key" ON "student_diets"("studentId");

-- AddForeignKey
ALTER TABLE "student_diets" ADD CONSTRAINT "student_diets_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_diets" ADD CONSTRAINT "student_diets_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "diet_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

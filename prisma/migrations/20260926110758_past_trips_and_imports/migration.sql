-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED', 'SAVED', 'DISCARDED');

-- AlterTable
ALTER TABLE "Trip" ADD COLUMN     "priceFrom" INTEGER,
ADD COLUMN     "priceNote" TEXT,
ADD COLUMN     "validUntil" DATE,
ALTER COLUMN "groupSizeMax" DROP NOT NULL;

-- CreateTable
CREATE TABLE "PastTrip" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "country" TEXT,
    "startDate" DATE,
    "endDate" DATE,
    "dateText" TEXT,
    "durationText" TEXT,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "places" TEXT[],
    "itinerary" TEXT,
    "accommodation" TEXT,
    "activities" TEXT[],
    "priceNote" TEXT,
    "status" "TripStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PastTrip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PastTripPhoto" (
    "id" TEXT NOT NULL,
    "pastTripId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "alt" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "approvedAt" TIMESTAMP(3),
    "rightsNote" TEXT,
    "sourceImportId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PastTripPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripImport" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sha256" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "extraction" JSONB,
    "model" TEXT,
    "error" TEXT,
    "extractedAt" TIMESTAMP(3),
    "pastTripId" TEXT,
    "savedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TripImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PastTrip_slug_key" ON "PastTrip"("slug");

-- CreateIndex
CREATE INDEX "PastTrip_status_startDate_idx" ON "PastTrip"("status", "startDate");

-- CreateIndex
CREATE INDEX "PastTripPhoto_pastTripId_sortOrder_idx" ON "PastTripPhoto"("pastTripId", "sortOrder");

-- CreateIndex
CREATE INDEX "TripImport_status_createdAt_idx" ON "TripImport"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TripImport_sha256_idx" ON "TripImport"("sha256");

-- AddForeignKey
ALTER TABLE "PastTripPhoto" ADD CONSTRAINT "PastTripPhoto_pastTripId_fkey" FOREIGN KEY ("pastTripId") REFERENCES "PastTrip"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripImport" ADD CONSTRAINT "TripImport_pastTripId_fkey" FOREIGN KEY ("pastTripId") REFERENCES "PastTrip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

/*
  Warnings:

  - The `status` column on the `property_availability` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Contact` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('AVAILABLE', 'BLOCKED', 'BOOKED');

-- AlterTable
ALTER TABLE "property_availability" DROP COLUMN "status",
ADD COLUMN     "status" "AvailabilityStatus" NOT NULL DEFAULT 'AVAILABLE';

-- DropTable
DROP TABLE "Contact";

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "reply" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contacts_isRead_idx" ON "contacts"("isRead");

-- CreateIndex
CREATE INDEX "contacts_userId_idx" ON "contacts"("userId");

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

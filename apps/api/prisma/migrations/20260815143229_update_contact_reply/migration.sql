-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "reply" TEXT,
ADD COLUMN     "userId" TEXT,
ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;

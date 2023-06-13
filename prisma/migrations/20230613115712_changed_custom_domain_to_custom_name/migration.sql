/*
  Warnings:

  - You are about to drop the column `customDomain` on the `urls` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[customName]` on the table `urls` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "short_url_analytics" ADD COLUMN     "updatedBy" UUID;

-- AlterTable
ALTER TABLE "urls" DROP COLUMN "customDomain",
ADD COLUMN     "customName" TEXT,
ADD COLUMN     "updatedBy" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "urls_customName_key" ON "urls"("customName");

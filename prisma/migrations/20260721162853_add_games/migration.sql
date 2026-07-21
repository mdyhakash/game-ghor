/*
  Warnings:

  - You are about to drop the column `image` on the `games` table. All the data in the column will be lost.
  - You are about to drop the `GameDevice` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `imageUrl` to the `games` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "GameDevice" DROP CONSTRAINT "GameDevice_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "GameDevice" DROP CONSTRAINT "GameDevice_gameId_fkey";

-- AlterTable
ALTER TABLE "games" DROP COLUMN "image",
ADD COLUMN     "deviceTypes" "DeviceType"[],
ADD COLUMN     "imageUrl" TEXT NOT NULL;

-- DropTable
DROP TABLE "GameDevice";

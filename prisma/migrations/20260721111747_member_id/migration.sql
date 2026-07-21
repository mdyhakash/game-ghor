/*
  Warnings:

  - A unique constraint covering the columns `[memberNo]` on the table `members` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "members" ADD COLUMN     "memberNo" SERIAL NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "members_memberNo_key" ON "members"("memberNo");

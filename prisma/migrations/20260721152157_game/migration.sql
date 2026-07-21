-- CreateEnum
CREATE TYPE "GameGenre" AS ENUM ('ACTION', 'ADVENTURE', 'RPG', 'SPORTS', 'RACING', 'FIGHTING', 'TACTICAL_FPS', 'FPS', 'BATTLE_ROYALE', 'OPEN_WORLD', 'HORROR', 'PUZZLE', 'SIMULATION');

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "games_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameDevice" (
    "gameId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,

    CONSTRAINT "GameDevice_pkey" PRIMARY KEY ("gameId","deviceId")
);

-- AddForeignKey
ALTER TABLE "GameDevice" ADD CONSTRAINT "GameDevice_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "games"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameDevice" ADD CONSTRAINT "GameDevice_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

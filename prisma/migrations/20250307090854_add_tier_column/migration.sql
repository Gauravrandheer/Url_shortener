-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('hobby', 'enterprise');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tier" "Tier" NOT NULL DEFAULT 'hobby';

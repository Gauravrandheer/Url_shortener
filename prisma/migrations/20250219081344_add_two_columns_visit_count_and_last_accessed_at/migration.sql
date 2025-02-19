-- AlterTable
ALTER TABLE "url_shortener" ADD COLUMN     "last_accessed_at" TIMESTAMP(3),
ADD COLUMN     "visit_count" INTEGER NOT NULL DEFAULT 0;

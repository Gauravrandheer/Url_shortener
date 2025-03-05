-- AlterTable
ALTER TABLE "url_shortener" ADD COLUMN     "user_id" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "url_shortener" ADD CONSTRAINT "url_shortener_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

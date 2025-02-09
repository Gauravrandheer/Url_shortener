-- CreateTable
CREATE TABLE "url_shortener" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "original_url" TEXT NOT NULL,
    "short_code" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "url_shortener_original_url_key" ON "url_shortener"("original_url");

-- CreateIndex
CREATE UNIQUE INDEX "url_shortener_short_code_key" ON "url_shortener"("short_code");

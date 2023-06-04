-- CreateTable
CREATE TABLE "QrCode" (
    "id" TEXT NOT NULL,
    "urlId" TEXT NOT NULL,
    "image" BYTEA NOT NULL,

    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_urlId_key" ON "QrCode"("urlId");

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "urls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

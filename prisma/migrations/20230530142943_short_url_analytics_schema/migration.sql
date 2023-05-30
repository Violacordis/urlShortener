-- CreateTable
CREATE TABLE "short_url_analytics" (
    "id" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "urlId" TEXT NOT NULL,

    CONSTRAINT "short_url_analytics_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "short_url_analytics" ADD CONSTRAINT "short_url_analytics_urlId_fkey" FOREIGN KEY ("urlId") REFERENCES "urls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

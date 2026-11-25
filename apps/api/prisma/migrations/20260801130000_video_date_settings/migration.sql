-- Backs apps/web's /api/admin/video-date/settings route, which previously
-- had no persistence at all (see ultra_datebuk-08-01-2026.txt, M-12).
CREATE TABLE "VideoDateSetting" (
    "type" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "VideoDateSetting_pkey" PRIMARY KEY ("type")
);

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { shouldAutoQuarantine } from "@/lib/moderation/thresholds";
import { analyzeVideo } from "@/lib/ai/video-analysis";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, datingIntent: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No video uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const aiScores = await analyzeVideo(buffer);

    const shouldQuarantine = shouldAutoQuarantine({
      intent: user.datingIntent ?? "CASUAL",
      scores: aiScores,
    });

    const status = shouldQuarantine
      ? "QUARANTINED"
      : aiScores.overall < 0.15
        ? "APPROVED"
        : "PENDING";

    const videoRecord = await prisma.video.create({
      data: {
        userId: user.id,
        filename: file.name,
        url: "s3://...",
        durationSec: aiScores.duration || 0,
        aiScores: aiScores as any,
        status,
        uploadedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      videoId: videoRecord.id,
      status,
      message: shouldQuarantine
        ? "Video under review - may take a few minutes"
        : "Video uploaded successfully",
    });
  } catch (error) {
    console.error("Video upload failed:", error);
    return NextResponse.json({ error: "Failed to process video" }, { status: 500 });
  }
}

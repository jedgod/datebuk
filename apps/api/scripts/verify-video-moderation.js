const { PrismaClient } = require("@prisma/client");

async function main() {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.videoModerationItem.findMany({
      take: 10,
      orderBy: { flaggedAt: "desc" },
    });
    console.log("VideoModerationItem rows:", rows.length);
    console.log(
      rows.map((r) => ({
        id: r.id,
        userId: r.userId,
        status: r.status,
        severity: r.severity,
        riskScore: r.riskScore,
      }))
    );
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();

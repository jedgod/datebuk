import { prisma } from "./src/lib/prisma";

async function main() {
  try {
    console.log("🔍 Checking User table structure...");
    
    // Try a simple query to see if displayName exists
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        displayName: true,
        datingIntent: true,
      },
    });
    
    console.log("✅ Query successful!");
    console.log("Sample user:", user);
  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error) {
      console.error("Message:", error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();

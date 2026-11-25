import { prisma } from "@/lib/prisma";

async function main() {
  try {
    // Try to get all columns for User table
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'User' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log("🗄️  User table columns:");
    console.table(result);
    
    // Also try a simple query to see if displayName exists
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        email: true,
        password: true,
        displayName: true,
        datingIntent: true,
      },
    });
    
    console.log("\n✅ Query successful, displayName and datingIntent exist!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

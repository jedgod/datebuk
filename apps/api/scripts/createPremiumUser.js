const bcrypt = require("bcrypt");
const { PrismaClient } = require("@prisma/client");

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    throw new Error("Usage: node scripts/createPremiumUser.js <email> <password>");
  }

  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error(`User already exists: ${email}`);
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        role: "USER",
        isAdmin: false,
        emailVerified: true,
        verifiedEmail: true,
        accountStatus: "ACTIVE",
        subscriptionTier: "PREMIUM",
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
      },
    });

    console.log(JSON.stringify({ ok: true, user }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});

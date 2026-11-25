const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStaff() {
  // Get all staff
  const staff = await prisma.staff.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  
  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });
  
  console.log('=== STAFF RECORDS ===');
  staff.forEach(s => console.log(`- ${s.name} (${s.email}) - Role: ${s.role}`));
  
  console.log('\n=== USER RECORDS ===');
  users.forEach(u => console.log(`- ${u.email} - Role: ${u.role}`));
  
  await prisma.$disconnect();
}

checkStaff().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

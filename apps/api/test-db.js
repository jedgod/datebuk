const { PrismaClient } = require('@prisma/client');

console.log('Creating Prisma client...');
const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

console.log('Connecting to database...');
prisma.$connect()
  .then(() => {
    console.log('✓ Connected to database');
    return prisma.user.count();
  })
  .then(count => {
    console.log(`✓ User count: ${count}`);
  })
  .catch(err => {
    console.error('✗ Connection failed:', err.message);
    console.error('Full error:', err);
  })
  .finally(() => {
    prisma.$disconnect();
    console.log('Disconnected');
  });

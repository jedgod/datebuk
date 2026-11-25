const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'testuser@example.com',
        password: hashedPassword,
        displayName: 'Test User',
        fullName: 'Test User Full',
        role: 'USER',
      },
    });
    
    console.log('Test user created:', user.email);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('User already exists');
    } else {
      console.error('Error creating user:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();

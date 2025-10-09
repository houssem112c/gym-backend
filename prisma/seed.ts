import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminEmail = 'admin@gym.com';
  const adminPassword = 'admin123';
  
  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('Admin user created:', {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });

  // Create a regular user for testing
  const userEmail = 'user@gym.com';
  const userPassword = 'user123';
  
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!existingUser) {
    const hashedUserPassword = await bcrypt.hash(userPassword, 10);
    
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        password: hashedUserPassword,
        name: 'Test User',
        role: 'USER',
      },
    });

    console.log('Test user created:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Create some test messages
    await prisma.contact.createMany({
      data: [
        {
          userId: user.id,
          name: user.name,
          email: user.email,
          subject: 'Membership Question',
          message: 'Hi, I would like to know more about your membership plans and pricing.',
          status: 'OPEN',
          priority: 'NORMAL',
        },
        {
          userId: user.id,
          name: user.name,
          email: user.email,
          subject: 'Class Schedule Query',
          message: 'Can you please provide information about yoga class schedules?',
          status: 'OPEN',
          priority: 'HIGH',
        },
      ],
    });

    console.log('Test messages created');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
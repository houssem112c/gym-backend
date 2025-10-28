const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateUserPassword(email, newPassword) {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the user's password
    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });
    
    console.log('Password updated successfully for:', user);
    return user;
  } catch (error) {
    console.error('Error updating password:', error.message);
    return null;
  }
}

async function main() {
  console.log('=== Updating Password ===\n');
  
  // Update your password to admin123
  await updateUserPassword('houssem.benmabrouk12@gmail.com', 'admin123');
  
  console.log('\n=== Testing Login ===\n');
  
  // Test the login
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'houssem.benmabrouk12@gmail.com' }
    });
    
    if (user) {
      const passwordMatch = await bcrypt.compare('admin123', user.password);
      console.log('Password test result:', passwordMatch ? 'SUCCESS' : 'FAILED');
    }
  } catch (error) {
    console.error('Error testing login:', error.message);
  }
  
  await prisma.$disconnect();
  console.log('\nPassword update completed.');
}

main();
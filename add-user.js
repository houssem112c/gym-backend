const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Get all users
async function getAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('All users in database:');
    console.table(users);
    return users;
  } catch (error) {
    console.error('Error fetching users:', error.message);
    return null;
  }
}

// Get user by email
async function getUserByEmail(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (user) {
      console.log('User found:', user);
    } else {
      console.log(`No user found with email: ${email}`);
    }
    return user;
  } catch (error) {
    console.error('Error fetching user by email:', error.message);
    return null;
  }
}

// Get user by ID
async function getUserById(id) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
    
    if (user) {
      console.log('User found:', user);
    } else {
      console.log(`No user found with ID: ${id}`);
    }
    return user;
  } catch (error) {
    console.error('Error fetching user by ID:', error.message);
    return null;
  }
}

// Verify user credentials (for testing login)
async function verifyUserCredentials(email, password) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return { success: false, message: 'User not found' };
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (passwordMatch) {
      console.log('Credentials verified successfully for:', user.email);
      return { 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      };
    } else {
      console.log('Invalid password for:', email);
      return { success: false, message: 'Invalid password' };
    }
  } catch (error) {
    console.error('Error verifying credentials:', error.message);
    return { success: false, message: 'Verification error' };
  }
}

// Add user function
async function addUser(email, password, name, role = 'USER') {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role
      }
    });
    
    console.log('User created successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    });
    return user;
  } catch (error) {
    console.error('Error creating user:', error.message);
    return null;
  }
}

// Main function to run different operations
async function main() {
  try {
    console.log('=== User Database Operations ===\n');
    
    // Get all users
    console.log('1. Fetching all users:');
    await getAllUsers();
    console.log('\n');
    
    // Test login with default admin
    console.log('2. Testing login with admin@gym.com:');
    await verifyUserCredentials('admin@gym.com', 'admin123');
    console.log('\n');
    
    // Test login with your email
    console.log('3. Testing login with houssem.benmabrouk12@gmail.com:');
    await verifyUserCredentials('houssem.benmabrouk12@gmail.com', 'admin123');
    console.log('\n');
    
  } catch (error) {
    console.error('Error in main function:', error.message);
  } finally {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  }
}

// Run the main function
main();
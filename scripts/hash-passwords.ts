import * as bcrypt from 'bcrypt';

/**
 * Script to hash passwords for dummy data
 * Usage: npx ts-node scripts/hash-passwords.ts
 */

async function hashPassword(password: string, saltRounds: number = 10): Promise<string> {
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
}

async function main(): Promise<void> {
  const password = 'aq123';
  
  console.log('🔐 Password Hashing Script');
  console.log('========================');
  console.log(`Original password: ${password}`);
  console.log('');
  
  try {
    const hashedPassword = await hashPassword(password);
    
    console.log('✅ Hashed password:');
    console.log(hashedPassword);
    console.log('');
    
    // Verify the hash works
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log(`✅ Verification test: ${isValid ? 'PASSED' : 'FAILED'}`);
    console.log('');
    
    console.log('📋 SQL INSERT examples:');
    console.log('======================');
    console.log('');
    console.log('-- For Employee table:');
    console.log(`UPDATE employees SET password_hash = '${hashedPassword}' WHERE email = 'employee@example.com';`);
    console.log('');
    console.log('-- For Admin table:');
    console.log(`UPDATE admins SET password = '${hashedPassword}' WHERE email = 'admin@example.com';`);
    console.log('');
    console.log('-- Bulk update all employees (use with caution):');
    console.log(`UPDATE employees SET password_hash = '${hashedPassword}';`);
    console.log('');
    console.log('-- Bulk update all admins (use with caution):');
    console.log(`UPDATE admins SET password = '${hashedPassword}';`);
    console.log('');
    console.log('📝 Prisma Client example:');
    console.log('========================');
    console.log('');
    console.log('// For updating employee password:');
    console.log(`await prisma.employee.update({`);
    console.log(`  where: { email: 'employee@example.com' },`);
    console.log(`  data: { passwordHash: '${hashedPassword}' }`);
    console.log(`});`);
    console.log('');
    console.log('// For updating admin password:');
    console.log(`await prisma.admin.update({`);
    console.log(`  where: { email: 'admin@example.com' },`);
    console.log(`  data: { password: '${hashedPassword}' }`);
    console.log(`});`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();

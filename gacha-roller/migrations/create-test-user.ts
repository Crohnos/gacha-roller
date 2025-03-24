// migrations/create-test-user.ts
import { Database } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../authUtils';

// This script creates a test user for development
export async function createTestUser(db: Database) {
  try {
    // Check if the test user exists
    const existingUser = await db.get(
      'SELECT * FROM users WHERE username = ?',
      ['TestUser']
    );

    if (existingUser) {
      console.log('Test user already exists');
      return;
    }

    // Generate a password hash
    const passwordHash = await hashPassword('password123');
    
    // Generate user_id
    const userId = uuidv4();
    
    // Check if email and password_hash columns exist
    const tableInfo = await db.all('PRAGMA table_info(users)');
    const columns = tableInfo.map(col => col.name);
    
    // Prepare the SQL query based on available columns
    let sql = 'INSERT INTO users (user_id, username';
    let params = [userId, 'TestUser'];
    
    if (columns.includes('email')) {
      sql += ', email';
      params.push('test@example.com');
    }
    
    if (columns.includes('password_hash')) {
      sql += ', password_hash';
      params.push(passwordHash);
    }
    
    if (columns.includes('created_at')) {
      sql += ', created_at';
      sql += ') VALUES (' + '?,'.repeat(params.length) + 'datetime("now"))';
    } else {
      sql += ') VALUES (' + '?,'.repeat(params.length) + ')';
    }
    
    // Insert the test user
    await db.run(sql, params);
    
    console.log('Created test user:');
    console.log('  Username: TestUser');
    console.log('  Email: test@example.com');
    console.log('  Password: password123');
    
  } catch (error) {
    console.error('Failed to create test user:', error);
  }
}
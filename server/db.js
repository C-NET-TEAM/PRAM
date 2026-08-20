import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Open database connection
export async function setupDatabase() {
  const dbPath = process.env.RAILWAY_VOLUME_MOUNT_PATH 
    ? path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, 'database.sqlite')
    : path.join(__dirname, 'database.sqlite');
    
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  // Create users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      bio TEXT,
      avatar TEXT
    )
  `);

  // Create social_accounts table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS social_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      platform TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      username TEXT,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      token_expiry DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, platform, provider_account_id),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Create calendar_events table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      timezone TEXT NOT NULL,
      type TEXT NOT NULL,
      caption TEXT,
      channels TEXT,
      status TEXT DEFAULT 'scheduled',
      media_path TEXT,
      social_post_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Migrate existing calendar_events table if needed
  try { await db.exec(`ALTER TABLE calendar_events ADD COLUMN status TEXT DEFAULT 'scheduled'`); } catch (e) { /* column exists */ }
  try { await db.exec(`ALTER TABLE calendar_events ADD COLUMN media_path TEXT`); } catch (e) { /* column exists */ }
  try { await db.exec(`ALTER TABLE calendar_events ADD COLUMN social_post_id TEXT`); } catch (e) { /* column exists */ }


  // Create user_settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY,
      language TEXT DEFAULT 'en',
      timezone TEXT DEFAULT 'UTC',
      ai_provider TEXT DEFAULT 'openai',
      ai_custom_base_url TEXT DEFAULT '',
      ai_api_key TEXT DEFAULT '',
      ai_messages TEXT DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Seed default user if none exists
  const count = await db.get('SELECT COUNT(*) as count FROM users');
  if (count.count === 0) {
    const hashedPassword = await bcrypt.hash('password123', 10);
    await db.run(`
      INSERT INTO users (name, email, password, bio, avatar)
      VALUES (?, ?, ?, ?, ?)
    `, [
      'Admin User', 
      'admin@example.com', 
      hashedPassword, 
      'System Administrator', 
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
    ]);
    console.log('Seeded default admin user (admin@example.com / password123)');
  }

  return db;
}

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import jwt from 'jsonwebtoken';

async function test() {
  const db = await open({ filename: 'server/database.sqlite', driver: sqlite3.Database });
  const user = await db.get("SELECT * FROM users LIMIT 1");
  if (!user) return console.log("No users found");
  
  const token = jwt.sign({ id: user.id, email: user.email }, 'super-secret-key-for-development-only', { expiresIn: '24h' });
  
  const res = await fetch('http://localhost:3001/api/analytics', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const text = await res.text();
  console.log(text);
}
test();

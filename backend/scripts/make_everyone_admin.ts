import 'dotenv/config';
import { db } from '../src/db/index.js';
import { users } from '../src/db/schema.js';

async function main() {
  console.log('Promovendo todos os utilizadores existentes a Admin...');
  try {
    await db.update(users).set({ isAdmin: true, isVerified: true });
    console.log('Sucesso!');
  } catch (err: any) {
    console.error('Erro:', err.message);
  }
  process.exit(0);
}

main();

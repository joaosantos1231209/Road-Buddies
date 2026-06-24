import { Client } from 'pg';

async function check() {
  const pgClient = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5432/rode_buddies'
  });
  
  try {
    await pgClient.connect();
    
    const { rows: users } = await pgClient.query('SELECT * FROM users');
    console.log(`Utilizadores no Postgres: ${users.length}`);

  } catch(e: any) {
    console.error('Erro:', e.message);
  } finally {
    await pgClient.end();
  }
}

check();

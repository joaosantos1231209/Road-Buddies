import 'dotenv/config';
import { db } from '../src/db/index.js';
import { cities } from '../src/db/schema.js';
import fs from 'fs';

const GLOBALS_OFFICES = ['Lisboa', 'Porto', 'Aveiro', 'Oliveira de Azeméis', 'Guarda', 'Braga', 'Leiria'];

async function main() {
  const concelhosData = JSON.parse(fs.readFileSync('./concelhos.json', 'utf8'));
  const allCities = concelhosData; // array of strings
  
  console.log('Sincronizando com a base de dados...', allCities.length);
  const finalCities = Array.from(new Set([...allCities, ...GLOBALS_OFFICES]));

  let ok = 0;
  for (const cityName of finalCities) {
    const isOffice = GLOBALS_OFFICES.includes(cityName);
    try {
      await db.insert(cities)
        .values({ name: cityName, isOffice: isOffice, isActive: true })
        .onConflictDoUpdate({
           target: cities.name,
           set: { isOffice: isOffice }
        });
      ok++;
    } catch (e: any) {
      console.error(`Erro inserir ${cityName}:`, e.message);
    }
  }

  console.log(`✓ Seeding concluído! Foram inseridos/atualizados ${ok} de ${finalCities.length} concelhos.`);
  process.exit(0);
}

main();

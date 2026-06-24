import 'dotenv/config';
import { db } from '../src/db/index.js';
import { cities } from '../src/db/schema.js';

const GLOBALS_OFFICES = ['Lisboa', 'Porto', 'Aveiro', 'Oliveira de Azeméis', 'Guarda', 'Braga', 'Leiria'];

async function main() {
  console.log('A obter lista de concelhos de Portugal da geoapi.pt...');
  let concelhosData: any[] = [];
  try {
    const res = await fetch('https://json.geoapi.pt/municipios', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Node.js)' }
    });
    concelhosData = await res.json();
  } catch (err: any) {
    console.warn('GeoAPI indisponível, a usar set de teste de concelhos...', err.message);
    concelhosData = [
       { nome: 'Almada' }, { nome: 'Faro' }, { nome: 'Coimbra' }, { nome: 'Viseu' }, { nome: 'Setúbal' }
    ];
  }

  const allCities = concelhosData.map((item: any) => item.nome);
  
  console.log('Sincronizando com a base de dados...');
  const finalCities = Array.from(new Set([...allCities, ...GLOBALS_OFFICES]));

  for (const cityName of finalCities) {
    const isOffice = GLOBALS_OFFICES.includes(cityName);
    try {
      await db.insert(cities)
        .values({ name: cityName, isOffice: isOffice, isActive: true })
        .onDuplicateKeyUpdate({
           set: { isOffice: isOffice }
         });
    } catch (e: any) {
      console.error(`Erro inserir ${cityName}:`, e.message);
    }
  }

  console.log(`✓ Seeding concluído! Foram inseridos/atualizados ${finalCities.length} concelhos.`);
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});

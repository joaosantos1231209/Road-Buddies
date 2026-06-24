import { Client } from 'pg';
import { db } from '../src/db/index.js';
import * as schema from '../src/db/schema.js';

async function migrate() {
  const pgClient = new Client({
    connectionString: 'postgresql://postgres:password@localhost:5432/rode_buddies'
  });
  
  try {
    await pgClient.connect();
  } catch(e: any) {
    console.error('❌ Falha ao ligar ao PostgreSQL:', e);
    process.exit(1);
  }

  try {
    // 1. Cities
    const { rows: cities } = await pgClient.query('SELECT * FROM cities');
    let cCount = 0;
    for (const c of cities) {
      try {
        await db.insert(schema.cities).values({
          id: c.id,
          name: c.name,
          isActive: !!c.is_active,
          isOffice: !!c.is_office
        });
        cCount++;
      } catch (e: any) {
        if (e.code !== 'ER_DUP_ENTRY') console.error(`Aviso cidade ${c.name}:`, e.message);
      }
    }
    console.log(`✅ Migradas ${cCount}/${cities.length} cidades`);

    // 2. Users
    const { rows: users } = await pgClient.query('SELECT * FROM users');
    let uCount = 0;
    for (const u of users) {
      try {
        await db.insert(schema.users).values({
          id: u.id,
          email: u.email,
          username: u.username,
          avatarUrl: u.avatar_url,
          phone: u.phone,
          vehicleInfo: typeof u.vehicle_info === 'string' ? u.vehicle_info : JSON.stringify(u.vehicle_info),
          isAdmin: !!u.is_admin,
          isVerified: !!u.is_verified,
          verificationCode: u.verification_code,
          verificationExpiry: u.verification_expiry,
          createdAt: u.created_at,
          updatedAt: u.updated_at,
          fcmToken: u.fcm_token
        });
        uCount++;
      } catch (e: any) {
        if (e.code !== 'ER_DUP_ENTRY') console.error(`Aviso utilizador ${u.email}:`, e.message);
      }
    }
    console.log(`✅ Migrados ${uCount}/${users.length} utilizadores`);

    // 3. Company Vehicles
    const { rows: vehicles } = await pgClient.query('SELECT * FROM company_vehicles');
    let vCount = 0;
    for (const v of vehicles) {
      try {
        await db.insert(schema.companyVehicles).values({
          id: v.id,
          brand: v.brand,
          model: v.model,
          plate: v.plate,
          officeId: v.office_id,
          isActive: !!v.is_active,
          createdAt: v.created_at
        });
        vCount++;
      } catch (e: any) {
        if (e.code !== 'ER_DUP_ENTRY') console.error(`Aviso veículo ${v.plate}:`, e.message);
      }
    }
    console.log(`✅ Migrados ${vCount}/${vehicles.length} veículos`);

    // 4. Trips
    const { rows: trips } = await pgClient.query('SELECT * FROM trips');
    let tCount = 0;
    for (const t of trips) {
      try {
        await db.insert(schema.trips).values({
          id: t.id,
          userId: t.user_id,
          type: t.type,
          originId: t.origin_id,
          destinationId: t.destination_id,
          departureTime: t.departure_time,
          returnTime: t.return_time,
          availableSeats: t.available_seats,
          vehicleType: t.vehicle_type,
          tripVehicleDetails: typeof t.trip_vehicle_details === 'string' ? t.trip_vehicle_details : JSON.stringify(t.trip_vehicle_details),
          companyVehicleId: t.company_vehicle_id,
          hidden: !!t.hidden,
          status: t.status,
          createdAt: t.created_at,
          updatedAt: t.updated_at
        });
        tCount++;
      } catch (e: any) {
        if (e.code !== 'ER_DUP_ENTRY') console.error(`Aviso viagem ${t.id}:`, e.message);
      }
    }
    console.log(`✅ Migradas ${tCount}/${trips.length} viagens`);

    // 5. Trip Participants
    const { rows: participants } = await pgClient.query('SELECT * FROM trip_participants');
    let pCount = 0;
    for (const p of participants) {
      try {
        await db.insert(schema.tripParticipants).values({
          id: p.id,
          tripId: p.trip_id,
          userId: p.user_id,
          joinedAt: p.joined_at
        });
        pCount++;
      } catch (e: any) {
        if (e.code !== 'ER_DUP_ENTRY') console.error(`Aviso participante:`, e.message);
      }
    }
    console.log(`✅ Migrados ${pCount}/${participants.length} participantes`);

    console.log('🎉 Migração concluída com sucesso!');
  } catch(e: any) {
    console.error('❌ ERRO CRÍTICO:', e);
  } finally {
    await pgClient.end();
    process.exit(0);
  }
}

migrate();

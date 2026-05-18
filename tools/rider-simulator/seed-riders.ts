/**
 * Seed Script
 *
 * Creates 20 simulated rider accounts in user-service so matching-service
 * can query them for availability and vehicle type.
 *
 * Run ONCE before starting the simulator:
 *   npm run seed
 *
 * Idempotent — skips riders that already exist (POST returns 409).
 */

import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:3001';
const RIDER_COUNT      = 20;

type VehicleType = 'MOTORCYCLE' | 'CAR' | 'BICYCLE' | 'VAN';
const VEHICLE_TYPES: VehicleType[] = ['MOTORCYCLE', 'CAR', 'BICYCLE', 'VAN'];

interface CreatedUser { id: string; }
interface CreatedRider { id: string; }

async function createUser(index: number): Promise<string | null> {
  const riderId = `sim-rider-${String(index).padStart(3, '0')}`;
  try {
    const { data } = await axios.post<CreatedUser>(
      `${USER_SERVICE_URL}/users/register`,
      {
        firstName: 'Sim',
        lastName:  `Rider${String(index).padStart(3, '0')}`,
        email:     `sim.rider${String(index).padStart(3, '0')}@dev.local`,
        password:  'Dev@12345',
        phone:     `+2507800${String(index).padStart(5, '0')}`,
      },
      { timeout: 5000 },
    );
    return data.id;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 409) {
      console.log(`  ↷ User for ${riderId} already exists — skipping`);
      return null;
    }
    throw err;
  }
}

async function createRider(userId: string, vehicleType: VehicleType, index: number): Promise<void> {
  const riderId = `sim-rider-${String(index).padStart(3, '0')}`;
  try {
    // Rider creation requires a JWT in production; for dev, user-service must allow it
    // or you can temporarily disable the guard on POST /riders.
    await axios.post<CreatedRider>(
      `${USER_SERVICE_URL}/riders`,
      {
        vehicleType,
        vehiclePlate: `SIM-${String(index).padStart(3, '0')}`,
      },
      {
        timeout: 5000,
        headers: { 'x-dev-user-id': userId }, // dev shortcut — see note below
      },
    );
    console.log(`  ✓ Rider ${riderId} created (${vehicleType})`);
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && err.response?.status === 409) {
      console.log(`  ↷ Rider ${riderId} already exists — skipping`);
      return;
    }
    console.error(`  ✗ Failed to create rider ${riderId}: ${(err as Error).message}`);
  }
}

async function main(): Promise<void> {
  console.log(`Seeding ${RIDER_COUNT} simulated riders into ${USER_SERVICE_URL}\n`);

  for (let i = 1; i <= RIDER_COUNT; i++) {
    const vehicleType = VEHICLE_TYPES[(i - 1) % VEHICLE_TYPES.length];
    console.log(`[${i}/${RIDER_COUNT}] sim-rider-${String(i).padStart(3, '0')} (${vehicleType})`);

    const userId = await createUser(i);
    if (userId) {
      await createRider(userId, vehicleType, i);
    }
  }

  console.log('\nDone. Run `npm start` to begin the location simulator.');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

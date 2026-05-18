/**
 * Rider Simulator
 *
 * Fakes N mobile apps posting location updates to geo-service every 5 seconds.
 * Riders drift around Kigali. Stop with Ctrl+C — on exit, active flags expire
 * naturally from Redis TTL (30 s) so no manual cleanup is needed.
 *
 * Usage:
 *   npm start                         # 20 riders, default settings
 *   RIDER_COUNT=5 npm start           # fewer riders for quick tests
 *   GEO_SERVICE_URL=http://... npm start
 */

import axios from 'axios';

const GEO_SERVICE_URL = process.env.GEO_SERVICE_URL ?? 'http://localhost:3004';
const RIDER_COUNT      = parseInt(process.env.RIDER_COUNT ?? '20', 10);
const INTERVAL_MS      = parseInt(process.env.INTERVAL_MS ?? '5000', 10);
const CENTER_LAT       = -1.9536;   // Kigali city centre
const CENTER_LNG       = 30.0606;
const SPAWN_RADIUS_KM  = 5;
const MOVEMENT_M_PER_TICK = 50;    // metres per tick

type VehicleType = 'MOTORCYCLE' | 'CAR' | 'BICYCLE' | 'VAN';

interface SimRider {
  id: string;
  vehicleType: VehicleType;
  lat: number;
  lng: number;
  heading: number;
}

function spawnNear(centerLat: number, centerLng: number, maxKm: number): { lat: number; lng: number } {
  const r     = maxKm * Math.sqrt(Math.random());
  const angle = Math.random() * 2 * Math.PI;
  return {
    lat: centerLat + (r * Math.cos(angle)) / 111,
    lng: centerLng + (r * Math.sin(angle)) / (111 * Math.cos((centerLat * Math.PI) / 180)),
  };
}

function move(rider: SimRider): void {
  // slight heading drift each tick — simulates real driving
  rider.heading = (rider.heading + (Math.random() - 0.5) * 30 + 360) % 360;
  const distKm  = (MOVEMENT_M_PER_TICK * (0.5 + Math.random())) / 1000;
  const rad     = (rider.heading * Math.PI) / 180;
  rider.lat    += (distKm / 111) * Math.cos(rad);
  rider.lng    += (distKm / 111) * Math.sin(rad) / Math.cos((rider.lat * Math.PI) / 180);
}

async function postLocation(rider: SimRider): Promise<void> {
  try {
    await axios.post(
      `${GEO_SERVICE_URL}/locations`,
      {
        riderId:   rider.id,
        lat:       rider.lat,
        lng:       rider.lng,
        heading:   Math.round(rider.heading),
        timestamp: new Date().toISOString(),
      },
      { timeout: 3000 },
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`✗ ${rider.id}: ${msg}`);
  }
}

function createRiders(): SimRider[] {
  const types: VehicleType[] = ['MOTORCYCLE', 'CAR', 'BICYCLE', 'VAN'];
  return Array.from({ length: RIDER_COUNT }, (_, i) => ({
    id: `sim-rider-${String(i + 1).padStart(3, '0')}`,
    vehicleType: types[i % types.length],
    ...spawnNear(CENTER_LAT, CENTER_LNG, SPAWN_RADIUS_KM),
    heading: Math.random() * 360,
  }));
}

async function main(): Promise<void> {
  console.log(`Spawning ${RIDER_COUNT} riders around Kigali (${GEO_SERVICE_URL})`);
  console.log('Press Ctrl+C to stop. Redis TTL will expire stale entries within 30 s.\n');

  const riders = createRiders();

  const timer = setInterval(async () => {
    await Promise.all(
      riders.map(async rider => {
        move(rider);
        await postLocation(rider);
      }),
    );
    console.log(`↻ ${riders.length} riders updated at ${new Date().toLocaleTimeString()}`);
  }, INTERVAL_MS);

  // Graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(timer);
    console.log('\nSimulator stopped. Rider active flags will expire in ≤30 s.');
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

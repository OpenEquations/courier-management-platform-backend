# Courier Platform — API Consumer Guide

A comprehensive guide for developers integrating with the Courier microservices backend.

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Running the platform](#2-running-the-platform)
3. [Service catalogue & Swagger UIs](#3-service-catalogue--swagger-uis)
4. [Authentication](#4-authentication)
5. [Onboarding flow](#5-onboarding-flow-new-user--rider)
6. [Ride-hailing flow](#6-ride-hailing-flow-passenger-requests-a-trip)
7. [Delivery flow](#7-delivery-flow-send-a-parcel)
8. [Real-time updates (Socket.IO)](#8-real-time-updates-socketio)
9. [Pricing estimates](#9-pricing-estimates)
10. [Payment & wallets](#10-payment--wallets)
11. [Geo / location tracking](#11-geo--location-tracking)
12. [Stub services](#12-stub-services)
13. [Error responses](#13-error-responses)

---

## 1. Architecture overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client Apps                              │
│              (Passenger app · Rider app · Ops dashboard)         │
└────────────┬──────────────────────────────────────┬─────────────┘
             │ HTTP/REST + Socket.IO                │ HTTP/REST
             ▼                                      ▼
      ┌─────────────┐                       ┌──────────────────┐
      │ user-service│                       │  delivery-service│
      │   :3001     │                       │     :3010        │
      └──────┬──────┘                       └──────────────────┘
             │ JWT issued here                      ▲
             │                                      │ internal
             ▼                                      │
      ┌─────────────┐     Kafka      ┌──────────────┴──────────┐
      │ trip-service│ ─────────────► │  matching-service :3007  │
      │   :3002     │ trip.created   │  (Kafka consumer only)   │
      │  [WS /trips]│ ◄───────────── └──────────────┬──────────┘
      └──────┬──────┘ rider-matched                  │ queries
             │                                       ▼
             │ calls internally          ┌──────────────────────┐
             ├──────────────────────────►│  geo-service :3004   │
             ├──────────────────────────►│  pricing-service:3003│
             ├──────────────────────────►│  payment-service:3006│
             └──────────────────────────►│  notification-svc:3005│
                                        └──────────────────────┘
```

**10 services total:**

| Service | Port | Tech | Notes |
|---|---|---|---|
| user-service | 3001 | NestJS | Identity, JWT auth, rider registration |
| trip-service | 3002 | NestJS | Trip lifecycle + Socket.IO real-time |
| pricing-service | 3003 | FastAPI/Python | ML fare prediction |
| geo-service | 3004 | NestJS | Redis-backed live rider location |
| notification-service | 3005 | NestJS | Push/SMS stub (not yet implemented) |
| payment-service | 3006 | NestJS | In-platform wallets & holds |
| matching-service | 3007 | NestJS | Kafka-driven rider matching (no REST) |
| rating-service | 3008 | NestJS | Post-trip ratings stub |
| routing-service | 3009 | NestJS | Route/ETA computation stub |
| delivery-service | 3010 | NestJS | Parcel delivery lifecycle |

---

## 2. Running the platform

```bash
# From the project root:
docker compose up -d

# Health-check all services are up:
for port in 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010; do
  echo -n "Port $port: "; curl -sf http://localhost:$port 2>/dev/null && echo OK || echo DOWN
done
```

After containers start, open the **interactive Swagger docs** for any service:

```
http://localhost:3001/api/docs   ← user-service
http://localhost:3002/api/docs   ← trip-service
http://localhost:3003/docs       ← pricing-service (FastAPI built-in)
http://localhost:3004/api/docs   ← geo-service
http://localhost:3005/api/docs   ← notification-service
http://localhost:3006/api/docs   ← payment-service
http://localhost:3007/api/docs   ← matching-service
http://localhost:3008/api/docs   ← rating-service
http://localhost:3009/api/docs   ← routing-service
http://localhost:3010/api/docs   ← delivery-service
```

---

## 3. Service catalogue & Swagger UIs

Each service's Swagger UI lets you execute requests directly in the browser.
Services that require a Bearer token have an **Authorize** button at the top right —
paste the JWT you receive from `POST /users/login` once and it's remembered across all requests.

### Which services require authentication?

| Service | Auth required? |
|---|---|
| user-service | Partial — `POST /users` (register) and `POST /users/login` are open; all other user/rider endpoints need a JWT |
| trip-service | Yes — all endpoints need a JWT |
| geo-service | No — internal service |
| pricing-service | No — open prediction endpoint |
| payment-service | No — internal/ops service (sits behind your API gateway) |
| delivery-service | No — internal/ops service; only `GET /track/:trackingNumber` is public-facing |
| matching/notification/rating/routing | No REST endpoints |

---

## 4. Authentication

Authentication is issued and validated exclusively by **user-service**.

### Step 1 — Register

```bash
curl -X POST http://localhost:3001/users \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Aline Uwase",
    "email": "aline.uwase@example.com",
    "password": "Str0ng!Pass",
    "phone": "+250788123456",
    "gender": "FEMALE"
  }'
```

### Step 2 — Log in and get a JWT

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/users/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"aline.uwase@example.com","password":"Str0ng!Pass"}' \
  | jq -r '.accessToken')

echo "JWT: $TOKEN"
```

### Step 3 — Use the token

Pass the token as a Bearer header on every authenticated request:

```bash
curl http://localhost:3001/users/me \
  -H "Authorization: Bearer $TOKEN"
```

In the Swagger UI, click **Authorize**, enter `Bearer <your-token>` (include the word "Bearer"), and click **Authorize** — all subsequent requests in the session will include it automatically.

### JWT payload

The token contains:
- `sub` — the user's UUID
- `email` — the user's email address
- `iat` / `exp` — standard issued-at and expiry timestamps

---

## 5. Onboarding flow (new user → rider)

A complete onboarding sequence for a new rider:

```bash
BASE_USER=http://localhost:3001

# 1. Register passenger account
curl -s -X POST $BASE_USER/users \
  -H 'Content-Type: application/json' \
  -d '{"name":"Jean Kagabo","email":"jean@example.com","password":"Pass1234!","phone":"+250788000001","gender":"MALE"}'

# 2. Log in
TOKEN=$(curl -s -X POST $BASE_USER/users/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"jean@example.com","password":"Pass1234!"}' | jq -r '.accessToken')

# 3. Get my profile
curl -s $BASE_USER/users/me -H "Authorization: Bearer $TOKEN"

# 4. Register as a rider (requires active user account)
curl -s -X POST $BASE_USER/riders \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "<USER_UUID_FROM_STEP_1>",
    "licenseNumber": "RW-DL-123456",
    "vehicleType": "MOTORBIKE"
  }'

# 5. Add a vehicle
curl -s -X POST "$BASE_USER/riders/<RIDER_UUID>/vehicles" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "make": "Bajaj",
    "model": "Boxer 150",
    "year": 2022,
    "plateNumber": "RAB-123-A",
    "color": "Red"
  }'
```

---

## 6. Ride-hailing flow (passenger requests a trip)

This is the primary flow — a passenger books a ride and a rider picks it up.

```
Passenger                   trip-service          pricing-service     matching-service
     |                           |                       |                    |
  1. GET /predict ────────────────────────────────────►  |
     |  (get fare estimate)      |                       |                    |
  2. POST /trips ──────────────► |                       |                    |
     |                           | ── publish trip.created ──────────────────►|
     |                           |                       |        query geo → |
     |                           |                       |    offer to rider  |
  3. WS: join-trip room ────────►|                       |                    |
     |                           |◄────────── rider accepts ─────────────────|
  4. WS: rider-matched event    |                       |                    |
     |                           |                                            |
  5. Trip progresses (startTrip, completeTrip)
```

### Step-by-step

```bash
BASE_TRIP=http://localhost:3002
BASE_PRICE=http://localhost:3003

# 1. Get a fare estimate (no auth needed)
curl -s -X POST $BASE_PRICE/predict \
  -H 'Content-Type: application/json' \
  -d '{
    "distance_km": 4.2,
    "duration_min": 12,
    "vehicle_type": "MOTORBIKE",
    "time_of_day": 17,
    "day_of_week": 1,
    "weather": "clear"
  }'

# 2. Create a trip (passenger's JWT required)
TRIP=$(curl -s -X POST $BASE_TRIP/trips \
  -H "Authorization: Bearer $PASSENGER_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "passengerId": "<PASSENGER_UUID>",
    "tripType": "RIDE",
    "pickupLat": -1.9441,
    "pickupLng": 30.0619,
    "pickupAddress": "KN 4 Ave, Kigali",
    "dropoffLat": -1.9706,
    "dropoffLng": 30.1044,
    "dropoffAddress": "KG 11 Ave, Kigali"
  }')

TRIP_ID=$(echo $TRIP | jq -r '.id')
echo "Trip created: $TRIP_ID"

# 3. Connect to Socket.IO to get real-time updates (see section 8)

# 4. When a rider is matched you receive a `rider-matched` WS event with riderId

# 5. Rider starts the trip
curl -s -X PATCH "$BASE_TRIP/trips/$TRIP_ID/start" \
  -H "Authorization: Bearer $RIDER_TOKEN"

# 6. Rider completes the trip
curl -s -X PATCH "$BASE_TRIP/trips/$TRIP_ID/complete" \
  -H "Authorization: Bearer $RIDER_TOKEN"
```

### Trip status lifecycle

```
CREATED → (matching-service broadcasts) → BROADCAST_ACTIVE
        → (rider accepts)               → ACCEPTED
        → (rider starts)                → IN_PROGRESS
        → (rider completes)             → COMPLETED

Exception paths:
CREATED / BROADCAST_ACTIVE / ACCEPTED → CANCELLED
IN_PROGRESS → DISPUTED (via POST /trips/:id/flag-dispute)
```

---

## 7. Delivery flow (send a parcel)

Delivery-service manages the full parcel lifecycle, including optional cash-on-delivery.

```bash
BASE_DLV=http://localhost:3010

# 1. Create a delivery (no auth — internal/ops tooling)
DLV=$(curl -s -X POST $BASE_DLV/deliveries \
  -H 'Content-Type: application/json' \
  -d '{
    "sender": {
      "id": "<SENDER_USER_UUID>",
      "name": "Aline Uwase",
      "phone": "+250788123456",
      "email": "aline@example.com"
    },
    "recipient": {
      "name": "Eric Niyonsenga",
      "phone": "+250788654321"
    },
    "pickupLocation": {
      "lat": -1.9441, "lng": 30.0619,
      "address": "KN 4 Ave, Kigali"
    },
    "dropoffLocation": {
      "lat": -1.9706, "lng": 30.1044,
      "address": "KG 11 Ave, Kigali"
    },
    "packageDetails": {
      "description": "Legal documents",
      "weightKg": 0.5
    },
    "codAmount": 15000
  }')

TRACKING=$(echo $DLV | jq -r '.trackingNumber')
DLV_ID=$(echo $DLV | jq -r '.id')

# 2. Share the tracking number with the recipient (public, no auth)
curl -s $BASE_DLV/track/$TRACKING

# 3. Assign to a courier trip
curl -s -X PATCH "$BASE_DLV/deliveries/$DLV_ID/assign" \
  -H 'Content-Type: application/json' \
  -d '{"tripId": "<TRIP_UUID>"}'

# 4. Record pickup (with proof)
curl -s -X PATCH "$BASE_DLV/deliveries/$DLV_ID/pick-up" \
  -H 'Content-Type: application/json' \
  -d '{
    "proofType": "PHOTO",
    "fileUrl": "https://storage.example.com/proofs/pickup-001.jpg",
    "capturedByRiderId": "<RIDER_UUID>"
  }'

# 5. Mark in transit → out for delivery
curl -s -X PATCH "$BASE_DLV/deliveries/$DLV_ID/in-transit"
curl -s -X PATCH "$BASE_DLV/deliveries/$DLV_ID/out-for-delivery"

# 6. Record successful delivery
curl -s -X PATCH "$BASE_DLV/deliveries/$DLV_ID/complete" \
  -H 'Content-Type: application/json' \
  -d '{
    "proofType": "SIGNATURE",
    "fileUrl": "https://storage.example.com/proofs/sig-001.jpg",
    "capturedByRiderId": "<RIDER_UUID>",
    "deliveredTo": "Eric Niyonsenga (recipient)"
  }'

# 7. COD flow — collect from recipient, then remit to platform
curl -s -X PATCH "$BASE_DLV/deliveries/$DLV_ID/collect-cod" \
  -H 'Content-Type: application/json' \
  -d '{"riderId": "<RIDER_UUID>"}'

curl -s -X PATCH "$BASE_DLV/deliveries/$DLV_ID/remit-cod"
```

### Delivery status lifecycle

```
CREATED → ASSIGNED → PICKED_UP → IN_TRANSIT → OUT_FOR_DELIVERY → DELIVERED
                                                               → FAILED (retry possible)
                                                               → RETURNED
CREATED / ASSIGNED → CANCELLED
```

---

## 8. Real-time updates (Socket.IO)

trip-service exposes a Socket.IO namespace at:

```
ws://localhost:3002/trips
```

### Passenger — track their trip

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3002/trips");

// Join the trip room once you have a trip ID
socket.emit("join-trip", { tripId: "<TRIP_UUID>" });

// Listen for status changes
socket.on("trip-updated", (trip) => {
  console.log("Trip status:", trip.status);
});

// Notified when a rider is matched
socket.on("rider-matched", (data) => {
  console.log("Rider found:", data.riderId);
});
```

### Rider — register for incoming offers

```javascript
const socket = io("http://localhost:3002/trips");

// Register to receive new trip offers in your area
socket.emit("register-rider", { riderId: "<RIDER_UUID>" });

// New offer arrives — accept it via REST
socket.on("new-trip-offer", (trip) => {
  console.log("Offer:", trip.id, "from", trip.pickupAddress);
  // Call POST /trips/:id/lock-broadcast to accept
});
```

### Events reference

| Event (emit) | Payload | Direction |
|---|---|---|
| `join-trip` | `{ tripId }` | Client → Server |
| `leave-trip` | `{ tripId }` | Client → Server |
| `register-rider` | `{ riderId }` | Client → Server |

| Event (on) | Payload | Description |
|---|---|---|
| `trip-updated` | `TripResponseDto` | Any status change on the trip |
| `rider-matched` | `{ tripId, riderId }` | A rider has been matched |
| `new-trip-offer` | `TripResponseDto` | A new trip is being offered to the rider |

---

## 9. Pricing estimates

pricing-service runs a scikit-learn regression model and is completely stateless.
No authentication required.

```bash
# Single estimate
curl -s -X POST http://localhost:3003/predict \
  -H 'Content-Type: application/json' \
  -d '{
    "distance_km": 6.5,
    "duration_min": 18,
    "vehicle_type": "CAR",
    "time_of_day": 8,
    "day_of_week": 0,
    "weather": "light_rain"
  }'

# Response:
# { "estimated_price": 4823.5, "currency": "RWF" }
```

**Input fields:**

| Field | Type | Values |
|---|---|---|
| `distance_km` | float | Trip distance in kilometres |
| `duration_min` | int | Expected trip duration in minutes |
| `vehicle_type` | string | `MOTORBIKE`, `CAR`, `TRUCK` |
| `time_of_day` | int | Hour of day 0–23 |
| `day_of_week` | int | 0 (Mon) – 6 (Sun) |
| `weather` | string | `clear`, `light_rain`, `heavy_rain` |

If the ML model file is missing the service returns `503 Service Unavailable`.
Check health via `GET http://localhost:3003/health`.

---

## 10. Payment & wallets

payment-service is an **internal** service called by trip-service automatically.
You interact with it directly only for account setup and balance inspection.

```bash
BASE_PAY=http://localhost:3006

# Open a wallet for a user (call once per user at account creation)
ACCOUNT=$(curl -s -X POST $BASE_PAY/accounts \
  -H 'Content-Type: application/json' \
  -d '{
    "ownerId": "<USER_UUID>",
    "ownerName": "Aline Uwase",
    "currency": "RWF",
    "openingBalance": 50000
  }')

ACCOUNT_ID=$(echo $ACCOUNT | jq -r '.id')

# Check balance
curl -s $BASE_PAY/accounts/$ACCOUNT_ID

# Top up
curl -s -X POST "$BASE_PAY/accounts/$ACCOUNT_ID/topup" \
  -H 'Content-Type: application/json' \
  -d '{"amount": 20000}'

# View transaction history
curl -s "$BASE_PAY/accounts/$ACCOUNT_ID/transactions?page=1&limit=20"
```

**The hold → release / refund cycle** is handled automatically by trip-service:
- On trip acceptance → `POST /transactions/hold`
- On trip completion → `POST /transactions/:id/release`
- On trip cancellation → `POST /transactions/:id/refund`

---

## 11. Geo / location tracking

geo-service provides a Redis-backed store of live rider positions.
No authentication required.

```bash
BASE_GEO=http://localhost:3004

# Rider app pushes position every ~5s
curl -s -X POST $BASE_GEO/locations \
  -H 'Content-Type: application/json' \
  -d '{
    "riderId": "<RIDER_UUID>",
    "lat": -1.9441,
    "lng": 30.0619,
    "heading": 87
  }'

# Find riders within 5 km of a pickup point
curl -s "$BASE_GEO/locations/nearby?lat=-1.9441&lng=30.0619&radiusKm=5&limit=10"

# Remove rider from the live map (e.g. when they go offline)
curl -s -X DELETE $BASE_GEO/locations/<RIDER_UUID>
```

**Notes:**
- Positions are stored in Redis — they are ephemeral and not persisted across restarts.
- Results are ordered by distance (nearest first).
- Coordinates must be WGS84 decimal degrees.

---

## 12. Stub services

The following services are scaffolded but not yet implemented.
They have Swagger docs explaining their intended API:

| Service | Port | Docs | Status |
|---|---|---|---|
| matching-service | 3007 | `http://localhost:3007/api/docs` | Event-driven (Kafka only) — no REST |
| notification-service | 3005 | `http://localhost:3005/api/docs` | Stub — logs only |
| rating-service | 3008 | `http://localhost:3008/api/docs` | Stub — not implemented |
| routing-service | 3009 | `http://localhost:3009/api/docs` | Stub — not implemented |

---

## 13. Error responses

All NestJS services use a consistent error envelope via `DomainExceptionFilter`:

```json
{
  "statusCode": 404,
  "message": "Trip not found",
  "error": "Not Found"
}
```

| Status | Meaning |
|---|---|
| 400 | Validation failed — check request body against the Swagger schema |
| 401 | Missing or expired JWT — re-authenticate via `POST /users/login` |
| 403 | Forbidden — you don't own this resource |
| 404 | Resource not found |
| 409 | Conflict — e.g. duplicate email, invalid state transition |
| 422 | Unprocessable — e.g. insufficient balance for a hold |
| 503 | Service unavailable — e.g. pricing model not loaded |

---

*Generated for the Courier Platform backend — 2026-06-08*

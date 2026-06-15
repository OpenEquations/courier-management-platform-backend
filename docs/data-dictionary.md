# Data Dictionary

Field-level reference for the persisted tables shown in the
[ERD diagrams](erd-diagram.md). Generated from the TypeORM entities under
`src/inflastructure/persistence/typeorm/entities/**/*.orm-entity.ts` in each
service — treat those files as the source of truth if this drifts.

Each service owns its own Postgres database; there are no cross-database
foreign keys. Columns marked "logical ref" are plain string IDs validated via
REST calls or Kafka events, not enforced by the database.

## 1. user-service (`user_db`)

### `users`

| Field | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | varchar | no | PK | User identifier. |
| `firstName` | varchar | no | | Given name. |
| `lastName` | varchar | no | | Family name. |
| `email` | varchar | no | unique | Login email, **PII**. |
| `gender` | enum `Gender` | no | `MALE`, `FEMALE`, `OTHER` | |
| `nationalId` | varchar | no | unique | National ID number, **PII**. |
| `password` | varchar | no | bcrypt hash | Never returned by APIs. |
| `isActive` | boolean | no | default `true` | Soft-disable flag for the account. |
| `phone` | varchar | yes | | Contact number, **PII**. |
| `createdAt` | timestamp | no | auto | |
| `updatedAt` | timestamp | no | auto | |

### `riders`

One-to-one extension of `users` for accounts that have opted into the
`RIDER` role.

| Field | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | varchar | no | PK | Rider profile identifier. |
| `userId` | varchar | no | FK -> `users.id` | Owning user account. |
| `vehicles` | jsonb | no | array of `{ type: VehicleType, licensePlate: string }` | `VehicleType`: `MOTORCYCLE`, `BICYCLE`, `CAR`, `VAN`, `TRUCK`. |
| `isAvailable` | boolean | no | default `true` | Whether the rider is currently accepting trip offers. |
| `createdAt` | timestamp | no | auto | |
| `updatedAt` | timestamp | no | auto | |

## 2. trip-service (`trip_db`)

### `trips`

Payment, timeline, package details and price-split info are embedded as
JSONB rather than normalized into separate tables.

| Field | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | varchar | no | PK | Trip identifier. |
| `type` | enum `TripType` | no | `STANDARD`, `EXPRESS`, `SCHEDULED`, `PACKAGE` | `PACKAGE` requires `packageDetails` and `deliveryId`. |
| `passengerId` | varchar | no | logical ref -> `users.id` | Who requested the trip. |
| `riderId` | varchar | yes | logical ref -> `riders.id` | Assigned once the broadcast is locked. |
| `originLat` / `originLng` | float | no | | Pickup coordinates. |
| `originAddress` | varchar | no | | Pickup address label. |
| `destinationLat` / `destinationLng` | float | no | | Drop-off coordinates. |
| `destinationAddress` | varchar | no | | Drop-off address label. |
| `requestedVehicleType` | enum `VehicleType` | no | `MOTORCYCLE`, `BICYCLE`, `CAR`, `VAN`, `TRUCK` | Vehicle class requested by the passenger. |
| `vehicleType` | enum `VehicleType` | yes | | Vehicle actually assigned. |
| `vehicleLicensePlate` | varchar | yes | | Plate of the assigned vehicle. |
| `predictedPrice` | float | no | > 0 | ML-predicted price (see [pricing-service](#5-stateless-services)). |
| `agreedPrice` | float | yes | > 0 when set | Price locked in when the broadcast is locked. |
| `tripStatus` | enum `TripStatus` | no | default `PENDING`; `PENDING`, `ONGOING`, `COMPLETED`, `CANCELLED`, `DISPUTED` | Overall trip lifecycle state. |
| `broadcastStatus` | enum `BroadcastStatus` | no | default `OPEN`; `OPEN`, `LOCKED`, `CLOSED` | State of the rider-matching broadcast. |
| `paymentStatus` | enum `PaymentStatus` | no | default `INITIAL`; `INITIAL`, `HELD`, `RELEASED`, `REFUNDED` | Mirrors the payment hold/release lifecycle. |
| `paymentSplits` | jsonb | no | default `[]`; array of `{ riderId, portion }` | Payout split across riders (e.g. after a handoff). |
| `timeline` | jsonb | no | default `[]`; array of `{ status: TripStatus, timestamp }` | Audit trail of status transitions. |
| `notes` | text | yes | | Free-text note from the passenger. |
| `distance` | float | yes | | Trip distance, in km. |
| `estimatedDuration` | float | yes | | Estimated duration, in minutes. |
| `cancellationReason` | text | yes | format `"<CancelledBy>: <reason>"` | `CancelledBy`: `CUSTOMER`, `RIDER`, `SYSTEM`. |
| `disputeReason` | text | yes | | Set when `tripStatus = DISPUTED`; retained even after `requeue()`. |
| `packageDetails` | jsonb | yes | `{ weight, dimensions: { width, height, depth }, description, isFragile }` | Only present when `type = PACKAGE`. |
| `deliveryId` | varchar | yes | logical ref -> `deliveries.id` | Set for `PACKAGE` trips. |
| `pickupConfirmed` | boolean | no | default `false` | Set when the passenger confirms pickup; gates `complete()`. |
| `holdTransactionId` | varchar | yes | logical ref -> `payment_transactions.id` | Transaction holding the passenger's payment. |
| `version` | int | no | optimistic lock | Incremented on every update. |
| `createdAt` | timestamp | no | auto | |
| `updatedAt` | timestamp | no | auto | |

### `outbox_events` / `processed_events`

Shared transactional-outbox tables, present in `trip-service` and
`delivery-service` with identical shapes.

| Field | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | varchar | no | PK | Outbox row identifier. |
| `eventType` | varchar | no | | Kafka event type, e.g. `trip.created`. |
| `aggregateId` | varchar | no | | ID of the owning aggregate (`trips.id` / `deliveries.id`). |
| `payload` | jsonb | no | | Event body published to Kafka. |
| `published` | boolean | no | default `false` | Set once the publisher confirms delivery. |
| `publishedAt` | timestamp | yes | | |
| `createdAt` | timestamp | no | auto | |

| Field | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `eventId` | varchar | no | PK | ID of the consumed Kafka event (idempotency key). |
| `eventType` | varchar | no | | |
| `processedAt` | timestamp | no | | |

## 3. delivery-service (`delivery_db`)

### `deliveries`

Sender, recipient, locations, package details, COD info, proofs and
attempts are all embedded JSONB — there are no separate
Recipient/CodInfo/Proof/Attempt tables.

| Field | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | varchar | no | PK | Delivery identifier. |
| `trackingNumber` | varchar | no | unique | Customer-facing tracking code. |
| `sender` | jsonb | no | `{ id, name, phone, email }` | `id` is a logical ref -> `users.id`. Contains **PII**. |
| `recipient` | jsonb | no | `{ name, phone, email? }` | **PII**. |
| `pickupLocation` | jsonb | no | `{ lat, lng, address }` | |
| `dropoffLocation` | jsonb | no | `{ lat, lng, address }` | |
| `packageDetails` | jsonb | no | `{ description, weightKg, lengthCm?, widthCm?, heightCm?, isFragile, hasSeal, sealDescription? }` | |
| `deliveryWindow` | jsonb | yes | `{ from, to }` | Requested delivery time window. |
| `specialInstructions` | varchar | yes | | Free-text handling instructions. |
| `codInfo` | jsonb | yes | `{ amount, status: CodStatus, collectedAt?, remittedAt? }` | `CodStatus`: `PENDING`, `COLLECTED`, `REMITTED`. |
| `status` | enum `DeliveryStatus` | no | default `CREATED`; `CREATED`, `ASSIGNED`, `PICKED_UP`, `IN_TRANSIT`, `OUT_FOR_DELIVERY`, `DELIVERED`, `FAILED_DELIVERY`, `RETURNED`, `CANCELLED` | Delivery lifecycle state. |
| `currentTripId` | varchar | yes | logical ref -> `trips.id` | Trip currently fulfilling this delivery. |
| `proofOfPickup` | jsonb | yes | `{ type: ProofType, fileUrl?, capturedAt, capturedByRiderId }` | `ProofType`: `SIGNATURE`, `PHOTO`, `QR_CODE`, `OTP`. |
| `proofOfDelivery` | jsonb | yes | `{ type: ProofType, fileUrl?, capturedAt, capturedByRiderId, deliveredTo }` | |
| `attempts` | jsonb | no | default `[]`; array of `{ riderId, attemptedAt, successful, failureReason?: FailureReason, notes? }` | `FailureReason`: `RECIPIENT_NOT_HOME`, `WRONG_ADDRESS`, `REFUSED_DELIVERY`, `INACCESSIBLE_LOCATION`, `WEATHER_CONDITIONS`, `OTHER`. |
| `timeline` | jsonb | no | default `[]`; array of `{ status: DeliveryStatus, timestamp }` | Audit trail of status transitions. |
| `cancellationReason` | varchar | yes | | |
| `parcelImages` | jsonb | no | default `[]`; string array (URLs) | Photos of the parcel taken at booking. |
| `pickupImages` | jsonb | no | default `[]`; string array (URLs) | Photos taken at pickup. |
| `createdAt` | timestamp | no | auto | |
| `updatedAt` | timestamp | no | auto | |

### `outbox_events` / `processed_events`

Same shape as in [trip-service](#outbox_events--processed_events).

## 4. payment-service (`payment_db`)

### `payment_accounts`

| Field | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | varchar | no | PK | Account identifier. |
| `ownerId` | varchar | no | unique index, logical ref -> `users.id` / `riders.id` | One wallet account per user/rider. |
| `ownerName` | varchar | no | | Display name, denormalized from user-service. |
| `balance` | decimal(14,2) | no | | Available balance. |
| `heldBalance` | decimal(14,2) | no | | Funds held against in-flight trips. |
| `currency` | varchar(3) | no | ISO 4217 | e.g. `USD`. |
| `status` | enum `AccountStatus` | no | default `ACTIVE`; `ACTIVE`, `SUSPENDED` | |
| `createdAt` | timestamp | no | auto | |
| `updatedAt` | timestamp | no | auto | |

### `payment_transactions`

| Field | Type | Nullable | Constraints | Description |
|---|---|---|---|---|
| `id` | varchar | no | PK | Transaction identifier. |
| `accountId` | varchar | no | indexed, logical ref -> `payment_accounts.id` | Account this transaction applies to. |
| `payerId` | varchar | no | indexed, logical ref -> `users.id` | User who initiated/owns the transaction. |
| `amount` | decimal(14,2) | no | | Transaction amount. |
| `currency` | varchar(3) | no | ISO 4217 | |
| `status` | enum `TransactionStatus` | no | default `HELD`; `HELD`, `RELEASED`, `REFUNDED`, `TOPUP`, `WITHDRAWAL` | |
| `reference` | varchar | yes | e.g. a `tripId` | External reference for reconciliation. |
| `createdAt` | timestamp | no | auto | |
| `updatedAt` | timestamp | no | auto | |

## 5. Stateless services

`pricing-service`, `geo-service`, `notification-service`,
`matching-service`, `rating-service`, and `routing-service` have no
persisted tables — see [erd-diagram.md](erd-diagram.md) for the full note.

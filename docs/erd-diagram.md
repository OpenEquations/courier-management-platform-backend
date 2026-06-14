# Entity-Relationship Diagrams

Each microservice owns its own Postgres database (per `docker-compose.yml`:
`user_db`, `trip_db`, `delivery_db`, `payment_db`). There are **no real
database-level foreign keys across services** — cross-service references are
"logical" (an id stored as a plain column, validated via REST calls /
Kafka events). `pricing-service`, `geo-service`, `notification-service`,
`matching-service`, `rating-service`, and `routing-service` are stateless and
have no persisted tables.

## 1. user-service (`user_db`)

```mermaid
erDiagram
    USERS {
        string id PK
        string firstName
        string lastName
        string email "unique"
        string gender "enum: Gender"
        string nationalId "unique"
        string password "hashed"
        boolean isActive
        string phone "nullable"
        timestamp createdAt
        timestamp updatedAt
    }
    RIDERS {
        string id PK
        string userId FK
        jsonb vehicles "array of vehicle objects: type, licensePlate"
        boolean isAvailable
        timestamp createdAt
        timestamp updatedAt
    }
    USERS ||--o| RIDERS : "has rider profile"
```

## 2. trip-service (`trip_db`)

Payment, timeline, package details and price-split information are embedded
as JSONB columns on `trips` rather than normalized into separate tables.

```mermaid
erDiagram
    TRIPS {
        string id PK
        string type "enum: TripType (RIDE / PACKAGE)"
        string passengerId "logical ref -> users.id"
        string riderId "nullable, logical ref -> riders.id"
        float originLat
        float originLng
        string originAddress
        float destinationLat
        float destinationLng
        string destinationAddress
        string requestedVehicleType "enum: VehicleType"
        string vehicleType "nullable, enum: VehicleType"
        string vehicleLicensePlate "nullable"
        float predictedPrice
        float agreedPrice "nullable"
        string tripStatus "enum: TripStatus"
        string broadcastStatus "enum: BroadcastStatus"
        string paymentStatus "enum: PaymentStatus"
        jsonb paymentSplits "array of riderId/portion, default empty"
        jsonb timeline "array of status/timestamp, default empty"
        text notes "nullable"
        float distance "nullable"
        float estimatedDuration "nullable"
        text cancellationReason "nullable"
        text disputeReason "nullable"
        jsonb packageDetails "nullable: weight, dimensions, description, isFragile"
        string deliveryId "nullable, logical ref -> deliveries.id"
        boolean pickupConfirmed
        string holdTransactionId "nullable, logical ref -> payment_transactions.id"
        int version "optimistic lock"
        timestamp createdAt
        timestamp updatedAt
    }
    OUTBOX_EVENTS {
        string id PK
        string eventType
        string aggregateId "trips.id"
        jsonb payload
        boolean published
        timestamp publishedAt "nullable"
        timestamp createdAt
    }
    PROCESSED_EVENTS {
        string eventId PK
        string eventType
        timestamp processedAt
    }
```

`outbox_events` and `processed_events` support the transactional outbox
pattern for publishing/consuming Kafka events; they are keyed by
`aggregateId` / `eventId`, not by a DB foreign key to `trips`.

## 3. delivery-service (`delivery_db`)

Sender, recipient, locations, package details, COD info, proofs and delivery
attempts are all embedded JSONB on `deliveries` — no separate
Recipient/CodInfo/Proof/DeliveryAttempt tables.

```mermaid
erDiagram
    DELIVERIES {
        string id PK
        string trackingNumber "unique"
        jsonb sender "embedded: id, name, phone, email"
        jsonb recipient "embedded: name, phone, email"
        jsonb pickupLocation "embedded: lat, lng, address"
        jsonb dropoffLocation "embedded: lat, lng, address"
        jsonb packageDetails "embedded: description, weightKg, dimensions, isFragile, hasSeal"
        jsonb deliveryWindow "nullable, embedded: from, to"
        string specialInstructions "nullable"
        jsonb codInfo "nullable, embedded: amount, status, collectedAt, remittedAt"
        string status "enum: DeliveryStatus"
        string currentTripId "nullable, logical ref -> trips.id"
        jsonb proofOfPickup "nullable, embedded proof"
        jsonb proofOfDelivery "nullable, embedded proof + deliveredTo"
        jsonb attempts "array of delivery attempts, default empty"
        jsonb timeline "array of status/timestamp, default empty"
        string cancellationReason "nullable"
        jsonb parcelImages "string array, default empty"
        jsonb pickupImages "string array, default empty"
        timestamp createdAt
        timestamp updatedAt
    }
    OUTBOX_EVENTS {
        string id PK
        string eventType
        string aggregateId "deliveries.id"
        jsonb payload
        boolean published
        timestamp publishedAt "nullable"
        timestamp createdAt
    }
    PROCESSED_EVENTS {
        string eventId PK
        string eventType
        timestamp processedAt
    }
```

## 4. payment-service (`payment_db`)

```mermaid
erDiagram
    PAYMENT_ACCOUNTS {
        string id PK
        string ownerId "unique index, logical ref -> users.id / riders.id"
        string ownerName
        decimal balance "14,2"
        decimal heldBalance "14,2"
        string currency "varchar 3"
        string status "enum: AccountStatus"
        timestamp createdAt
        timestamp updatedAt
    }
    PAYMENT_TRANSACTIONS {
        string id PK
        string accountId "indexed, logical ref -> payment_accounts.id"
        string payerId "indexed, logical ref -> users.id"
        decimal amount "14,2"
        string currency "varchar 3"
        string status "enum: TransactionStatus"
        string reference "nullable, e.g. tripId"
        timestamp createdAt
        timestamp updatedAt
    }
    PAYMENT_ACCOUNTS ||--o{ PAYMENT_TRANSACTIONS : "holds/releases/refunds"
```

Note: `accountId`/`payerId` are plain indexed columns, not TypeORM
`@ManyToOne` relations — the relationship is logical/application-enforced.

## 5. Cross-service logical references (high-level)

This view collapses each service's tables to their primary aggregate and
shows the **logical** (cross-database, non-enforced) relationships that tie
the system together.

```mermaid
erDiagram
    USERS ||--o| RIDERS : "has rider profile"
    USERS ||--o{ TRIPS : "places (passengerId)"
    RIDERS ||--o{ TRIPS : "serves (riderId)"
    TRIPS ||--o| DELIVERIES : "fulfills (deliveryId / currentTripId)"
    TRIPS ||--o| PAYMENT_TRANSACTIONS : "places hold (holdTransactionId)"
    USERS ||--o{ PAYMENT_ACCOUNTS : "owns (ownerId)"
    PAYMENT_ACCOUNTS ||--o{ PAYMENT_TRANSACTIONS : "holds/releases/refunds"
    DELIVERIES }o--|| TRIPS : "currentTripId references trips.id"
```

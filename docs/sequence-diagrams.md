# Sequence Diagrams

## 1. Ride Booking & Rider Matching

Covers `POST /trips`, the fare prediction call to `pricing-service`, and the
event-driven matching flow (`trip.created` → `matching.events` → rider offer
→ `lock-broadcast`).

```mermaid
sequenceDiagram
    actor Passenger as Passenger App
    participant Trip as trip-service
    participant Pricing as pricing-service
    participant Kafka
    participant Matching as matching-service
    participant Geo as geo-service
    participant UserSvc as user-service
    participant Notif as notification-service
    actor Rider as Rider App

    Passenger->>Trip: POST /trips {origin, destination, vehicleType}
    Trip->>Pricing: POST /predict {distance_km, hour_of_day, weather}
    Pricing-->>Trip: 200 {cost}
    Trip->>Trip: create Trip (PENDING, broadcastStatus=OPEN,\npredictedPrice=cost)
    Trip->>Trip: write outbox event trip.created
    Trip-->>Passenger: 201 Created {trip}

    Trip->>Kafka: publish trip.created (outbox poller)
    Kafka->>Matching: consume trip.created

    Matching->>Geo: GET /nearby?lat&lng&radiusKm
    Geo-->>Matching: [riderId, distance][]
    Matching->>UserSvc: GET /riders/batch?ids=...
    UserSvc-->>Matching: riders[] (vehicle, availability)
    Matching->>Matching: filter by vehicleType & availability
    Matching->>Kafka: publish matching.events (rider.offer)

    Kafka->>Notif: consume matching.events
    Notif->>Rider: push / socket "new-trip-offer"

    Rider->>Trip: PATCH /trips/:id/lock-broadcast\n{riderId, vehicle, agreedPrice}
    Trip->>Trip: trip.lockBroadcast()\nbroadcastStatus=LOCKED
    Trip->>Trip: write outbox event trip.broadcast_locked
    Trip-->>Rider: 200 OK {trip}
    Trip->>Kafka: publish trip.broadcast_locked
    Kafka->>Notif: consume trip.broadcast_locked
    Notif->>Passenger: push "rider-matched"
```

## 2. Trip Lifecycle: Pickup → Completion → Payment Release

```mermaid
sequenceDiagram
    actor Rider as Rider App
    actor Passenger as Passenger App
    participant Trip as trip-service
    participant Payment as payment-service
    participant Kafka
    participant Notif as notification-service

    Rider->>Trip: PATCH /trips/:id/start
    Trip->>Trip: trip.start()\ntripStatus=ONGOING, broadcastStatus=CLOSED
    Trip-->>Rider: 200 OK

    Passenger->>Trip: PATCH /trips/:id/confirm-pickup
    Trip->>Payment: POST /transactions/hold\n{accountId, amount: agreedPrice, reference: tripId}
    Payment->>Payment: account.hold(amount)
    Payment-->>Trip: 201 {transactionId, status: HELD}
    Trip->>Trip: payment.hold(), pickupConfirmed=true
    Trip-->>Passenger: 200 OK

    Rider->>Trip: PATCH /trips/:id/complete
    Trip->>Trip: trip.complete()\ntripStatus=COMPLETED (requires pickupConfirmed)
    Trip-->>Rider: 200 OK

    Passenger->>Trip: PATCH /trips/:id/confirm-completion
    Trip->>Payment: POST /transactions/:id/release
    Payment->>Payment: account.release(amount) → payout to rider
    Payment-->>Trip: 200 {status: RELEASED}
    Trip->>Trip: payment.release()
    Trip->>Trip: write outbox event trip.completed
    Trip-->>Passenger: 200 OK

    Trip->>Kafka: publish trip.completed
    Kafka->>Notif: consume trip.completed
    Notif->>Passenger: notify "trip completed"
    Notif->>Rider: notify "payment released"
```

## 3. Package Delivery Flow

Covers parcel creation, the resulting `PACKAGE` trip, assignment, and the
delivery status progression including optional cash-on-delivery (COD).

```mermaid
sequenceDiagram
    actor Sender as Passenger App (Sender)
    participant Delivery as delivery-service
    participant Kafka
    participant Trip as trip-service
    participant Matching as matching-service
    actor Rider as Rider App
    actor Admin as Admin Portal

    Sender->>Delivery: POST /deliveries\n{sender, recipient, pickup, dropoff, packageDetails, codInfo?}
    Delivery->>Delivery: create Delivery (status=CREATED)
    Delivery->>Delivery: write outbox event delivery.created
    Delivery-->>Sender: 201 Created {trackingNumber}

    Delivery->>Kafka: publish delivery.created
    Kafka->>Trip: consume delivery.created
    Trip->>Trip: create Trip (type=PACKAGE, deliveryId,\npredictedPrice via pricing-service)
    Trip->>Kafka: publish trip.created

    Kafka->>Matching: consume trip.created
    Note over Matching,Rider: same matching flow as diagram 1
    Rider->>Trip: PATCH /trips/:id/lock-broadcast
    Trip->>Kafka: publish trip.broadcast_locked {deliveryId}
    Kafka->>Delivery: consume trip.broadcast_locked
    Delivery->>Delivery: delivery.assignToTrip(tripId)\nstatus=ASSIGNED

    Rider->>Delivery: PATCH /deliveries/:id/pick-up {proofOfPickup}
    Delivery->>Delivery: recordPickup() → status=PICKED_UP
    Delivery->>Kafka: publish delivery.picked_up

    Rider->>Delivery: PATCH /deliveries/:id/in-transit
    Delivery->>Delivery: status=IN_TRANSIT
    Rider->>Delivery: PATCH /deliveries/:id/out-for-delivery
    Delivery->>Delivery: status=OUT_FOR_DELIVERY

    Rider->>Delivery: PATCH /deliveries/:id/complete {proofOfDelivery}
    Delivery->>Delivery: recordSuccessfulDelivery()\nstatus=DELIVERED
    Delivery->>Kafka: publish delivery.delivered

    opt Cash on delivery
        Rider->>Delivery: PATCH /deliveries/:id/cod/collect
        Delivery->>Delivery: codInfo.status=COLLECTED
        Delivery->>Kafka: publish cod.collected
        Admin->>Delivery: PATCH /deliveries/:id/cod/remit
        Delivery->>Delivery: codInfo.status=REMITTED
    end
```

## 4. Cancellation, Dispute & Rebroadcast

```mermaid
sequenceDiagram
    actor Passenger as Passenger App
    actor Admin as Admin Portal
    participant Trip as trip-service
    participant Payment as payment-service
    participant Kafka
    participant Notif as notification-service
    participant Delivery as delivery-service

    alt Direct cancellation
        Passenger->>Trip: PATCH /trips/:id/cancel {reason}
        Trip->>Trip: trip.cancel(CUSTOMER, reason)\ntripStatus=CANCELLED
        opt payment.isHeld()
            Trip->>Payment: POST /transactions/:id/refund
            Payment->>Payment: account.refund(amount)
            Payment-->>Trip: 200 {status: REFUNDED}
            Trip->>Trip: payment.refund()
        end
        Trip->>Kafka: publish trip.cancelled
        Kafka->>Notif: notify passenger & rider
        Kafka->>Delivery: consume trip.cancelled\n(unassign delivery if PACKAGE)
    else Dispute raised
        Passenger->>Trip: PATCH /trips/:id/dispute {reason}
        Trip->>Trip: trip.flagForDispute(CUSTOMER, reason)\ntripStatus=DISPUTED
        Trip->>Kafka: publish trip.disputed
        Kafka->>Notif: alert admin / support

        Admin->>Trip: PATCH /trips/:id/rebroadcast
        Trip->>Trip: trip.requeue()\nclear rider/vehicle/agreedPrice,\ntripStatus=PENDING, broadcastStatus=OPEN
        opt payment.isHeld()
            Trip->>Payment: POST /transactions/:id/refund
            Payment-->>Trip: 200 {status: REFUNDED}
            Trip->>Trip: payment.refund()
        end
        Trip->>Kafka: publish trip.created (re-broadcast for matching)
    end
```

## 5. Admin: Release a Stuck Trip

Covers the `admin-release` escape hatch used by the admin portal's
"Release Stale Trip" action.

```mermaid
sequenceDiagram
    actor Admin as Admin Portal
    participant Trip as trip-service
    participant Payment as payment-service

    Admin->>Trip: PATCH /trips/:id/admin-release

    alt tripStatus in {PENDING, ONGOING, DISPUTED}
        Trip->>Trip: trip.cancel(SYSTEM, "admin release")\ntripStatus=CANCELLED
        opt payment.isHeld()
            Trip->>Payment: POST /transactions/:id/refund
            Payment-->>Trip: 200 {status: REFUNDED}
        end
        Trip-->>Admin: 200 OK {trip}
    else tripStatus == COMPLETED and payment.isHeld()
        Trip->>Payment: POST /transactions/:id/release
        Payment-->>Trip: 200 {status: RELEASED}
        Trip->>Trip: payment.release()
        Trip-->>Admin: 200 OK {trip}
    else already terminal
        Trip-->>Admin: 409 Conflict "trip already settled"
    end
```

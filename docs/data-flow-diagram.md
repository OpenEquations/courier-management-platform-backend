# Data Flow Diagrams

Mermaid has no native DFD shape set, so these use `flowchart` with the usual
DFD conventions:

- **Rectangles** = external entities (people / outside systems)
- **Rounded / circle nodes** = processes (transformations)
- **Cylinders** = data stores (databases, caches, files, message log)
- **Labelled arrows** = data flows

## 1. Context Diagram (Level 0)

The whole platform treated as a single process, showing the data that
crosses its boundary.

```mermaid
flowchart TB
    Passenger["Passenger\n(mobile app)"]
    Rider["Rider / Courier\n(mobile app)"]
    Admin["Admin\n(admin portal)"]
    WeatherSrc["Weather / time context\n(request metadata)"]

    Platform(("Courier Platform\n(trip booking, matching,\ndelivery & payments)"))

    MlModel[("ml-models/\nmoto_cost_model.pkl")]

    Passenger -->|"trip/delivery requests, cancellations,\npayment confirmations, ratings"| Platform
    Platform -->|"price estimates, trip/delivery status,\nrider details, notifications"| Passenger

    Rider -->|"availability, location updates,\nlock-broadcast, pickup/delivery proofs"| Platform
    Platform -->|"trip offers, assigned trips,\npayout notifications"| Rider

    Admin -->|"rebroadcast / admin-release,\nCOD remit, user management"| Platform
    Platform -->|"operational reports, stuck-trip alerts,\nuser & trip records"| Admin

    WeatherSrc -.->|"distance_km, hour_of_day, weather"| Platform
    Platform -.->|"feature vector"| MlModel
    MlModel -.->|"predicted cost"| Platform
```

## 2. Level 1 — Ride Booking & Pricing

```mermaid
flowchart LR
    Passenger["Passenger App"]
    Rider["Rider App"]

    P1((("P1\nManage Trip\nRequest")))
    P2((("P2\nPredict\nPrice")))
    P3((("P3\nMatch Rider")))
    P4((("P4\nDispatch\nNotifications")))

    DTrip[("trip_db\n(trips, outbox_events)")]
    DUser[("user_db\n(users, riders)")]
    DGeo[("redis\n(geo-index)")]
    DModel[("ml-models/\nmoto_cost_model.pkl")]
    Kafka[("Kafka\n(trip.events, matching.events)")]

    Passenger -->|"POST /trips\n(origin, destination, vehicleType)"| P1
    P1 -->|"distance_km, hour_of_day, weather"| P2
    P2 -->|"feature vector"| DModel
    DModel -->|"predicted cost"| P2
    P2 -->|"predictedPrice"| P1
    P1 -->|"create trip record"| DTrip
    P1 -->|"trip.created event"| Kafka
    P1 -->|"trip {id, status}"| Passenger

    Kafka -->|"consume trip.created"| P3
    P3 -->|"GET /nearby (lat, lng, radius)"| DGeo
    P3 -->|"GET /riders/batch"| DUser
    P3 -->|"rider.offer"| Kafka

    Kafka -->|"consume matching.events"| P4
    P4 -->|"push: new-trip-offer"| Rider

    Rider -->|"PATCH /lock-broadcast\n(riderId, vehicle, agreedPrice)"| P1
    P1 -->|"update broadcastStatus=LOCKED"| DTrip
    P1 -->|"trip.broadcast_locked"| Kafka
    Kafka -->|"consume trip.broadcast_locked"| P4
    P4 -->|"push: rider-matched"| Passenger
```

## 3. Level 1 — Trip Lifecycle & Payment

```mermaid
flowchart LR
    Passenger["Passenger App"]
    Rider["Rider App"]

    P1((("P1\nManage Trip\nLifecycle")))
    P5((("P5\nHold / Release /\nRefund Payment")))
    P4((("P4\nDispatch\nNotifications")))

    DTrip[("trip_db\n(trips)")]
    DPayment[("payment_db\n(payment_accounts,\npayment_transactions)")]
    Kafka[("Kafka\n(trip.events)")]

    Rider -->|"start / complete"| P1
    Passenger -->|"confirm-pickup /\nconfirm-completion"| P1

    P1 -->|"read/update tripStatus,\nbroadcastStatus, pickupConfirmed"| DTrip

    P1 -->|"hold(amount, tripId)"| P5
    P5 -->|"debit available, credit held"| DPayment
    P5 -->|"transactionId, status=HELD"| P1

    P1 -->|"release(transactionId)"| P5
    P5 -->|"move held -> payout"| DPayment
    P5 -->|"status=RELEASED"| P1

    P1 -->|"trip.completed"| Kafka
    Kafka -->|"consume trip.completed"| P4
    P4 -->|"notify: trip completed /\npayment released"| Passenger
    P4 -->|"notify: payment released"| Rider
```

## 4. Level 1 — Package Delivery & COD

```mermaid
flowchart LR
    Sender["Passenger App\n(sender)"]
    Rider["Rider App"]
    Admin["Admin Portal"]

    P6((("P6\nManage\nDelivery")))
    P1((("P1\nManage Trip\nRequest")))
    P3((("P3\nMatch Rider")))

    DDelivery[("delivery_db\n(deliveries,\noutbox_events)")]
    DTrip[("trip_db\n(trips)")]
    Kafka[("Kafka\n(delivery.events,\ntrip.events)")]

    Sender -->|"POST /deliveries\n(sender, recipient, packageDetails, codInfo?)"| P6
    P6 -->|"create delivery (CREATED)"| DDelivery
    P6 -->|"delivery.created"| Kafka

    Kafka -->|"consume delivery.created"| P1
    P1 -->|"create trip (type=PACKAGE, deliveryId)"| DTrip
    P1 -->|"trip.created"| Kafka
    Kafka -->|"consume trip.created"| P3
    P3 -->|"trip.broadcast_locked {deliveryId}"| Kafka
    Kafka -->|"consume trip.broadcast_locked"| P6
    P6 -->|"assignToTrip -> status=ASSIGNED"| DDelivery

    Rider -->|"pick-up / in-transit /\nout-for-delivery / complete\n(proof images)"| P6
    P6 -->|"update status, timeline,\nproofOfPickup/Delivery, parcelImages"| DDelivery
    P6 -->|"delivery.delivered"| Kafka

    Rider -->|"cod/collect"| P6
    P6 -->|"codInfo.status=COLLECTED"| DDelivery
    P6 -->|"cod.collected"| Kafka

    Admin -->|"cod/remit"| P6
    P6 -->|"codInfo.status=REMITTED"| DDelivery
```

## 5. Level 1 — Cancellation, Dispute & Admin Release

```mermaid
flowchart LR
    Passenger["Passenger App"]
    Admin["Admin Portal"]

    P1((("P1\nManage Trip\nLifecycle")))
    P5((("P5\nHold / Release /\nRefund Payment")))
    P4((("P4\nDispatch\nNotifications")))
    P6((("P6\nManage\nDelivery")))

    DTrip[("trip_db\n(trips)")]
    DPayment[("payment_db\n(payment_transactions)")]
    DDelivery[("delivery_db\n(deliveries)")]
    Kafka[("Kafka\n(trip.events)")]

    Passenger -->|"cancel(reason) /\ndispute(reason)"| P1
    Admin -->|"rebroadcast /\nadmin-release"| P1

    P1 -->|"update tripStatus,\nbroadcastStatus, cancellationReason"| DTrip
    P1 -->|"refund(transactionId)"| P5
    P5 -->|"move held -> available"| DPayment
    P5 -->|"status=REFUNDED"| P1

    P1 -->|"trip.cancelled / trip.disputed /\ntrip.created (rebroadcast)"| Kafka
    Kafka -->|"consume trip.cancelled"| P6
    P6 -->|"unassign delivery (if PACKAGE)"| DDelivery
    Kafka -->|"consume trip.* events"| P4
    P4 -->|"notify passenger / rider / admin"| Passenger
```

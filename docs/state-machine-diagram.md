# State Machine Diagrams

## 1. Trip Status (`trip-service`)

`broadcastStatus` is modelled as a nested region of `PENDING`, since locking
and releasing the broadcast only makes sense while the trip is still pending.

```mermaid
stateDiagram-v2
    [*] --> PENDING : create trip\n(broadcastStatus=OPEN)

    state PENDING {
        [*] --> Open
        Open --> Locked : lock-broadcast\n(rider, vehicle, agreedPrice)
        Locked --> Open : release-broadcast
    }

    PENDING --> ONGOING : start()\n[broadcastStatus=Locked]
    PENDING --> CANCELLED : cancel()

    ONGOING --> COMPLETED : complete()\n[pickupConfirmed=true]
    ONGOING --> DISPUTED : dispute()
    ONGOING --> CANCELLED : cancel()\n(refund if payment held)

    DISPUTED --> PENDING : rebroadcast()\n[requeue: clear rider/vehicle/agreedPrice,\nbroadcastStatus=OPEN, refund if held]
    DISPUTED --> CANCELLED : cancel() / admin-release\n(refund if payment held)

    COMPLETED --> [*] : confirm-completion\n(payment released)
    CANCELLED --> [*]
```

## 2. Payment Status (within `Trip.payment`)

```mermaid
stateDiagram-v2
    [*] --> INITIAL : trip created

    INITIAL --> HELD : confirm-pickup\n→ payment.hold()
    HELD --> RELEASED : confirm-completion\n→ payment.release() → payout to rider
    HELD --> REFUNDED : trip cancelled / rebroadcast\n→ payment.refund()

    RELEASED --> [*]
    REFUNDED --> [*]
```

## 3. Delivery Status (`delivery-service`)

```mermaid
stateDiagram-v2
    [*] --> CREATED : create delivery

    CREATED --> ASSIGNED : assign(tripId)\n(trip.broadcast_locked)
    ASSIGNED --> CREATED : unassign()\n(trip.broadcast_released)

    ASSIGNED --> PICKED_UP : pick-up\n(record proofOfPickup)
    PICKED_UP --> IN_TRANSIT : in-transit
    PICKED_UP --> OUT_FOR_DELIVERY : out-for-delivery
    IN_TRANSIT --> OUT_FOR_DELIVERY : out-for-delivery

    IN_TRANSIT --> DELIVERED : complete\n(record proofOfDelivery)
    OUT_FOR_DELIVERY --> DELIVERED : complete\n(record proofOfDelivery)

    IN_TRANSIT --> FAILED_DELIVERY : fail(reason)
    OUT_FOR_DELIVERY --> FAILED_DELIVERY : fail(reason)
    FAILED_DELIVERY --> ASSIGNED : assign(newTripId)\n(retry)

    CREATED --> RETURNED : return(reason)
    ASSIGNED --> RETURNED : return(reason)
    PICKED_UP --> RETURNED : return(reason)
    IN_TRANSIT --> RETURNED : return(reason)
    OUT_FOR_DELIVERY --> RETURNED : return(reason)
    FAILED_DELIVERY --> RETURNED : return(reason)

    CREATED --> CANCELLED : cancel(reason)
    ASSIGNED --> CANCELLED : cancel(reason)
    PICKED_UP --> CANCELLED : cancel(reason)
    IN_TRANSIT --> CANCELLED : cancel(reason)
    OUT_FOR_DELIVERY --> CANCELLED : cancel(reason)
    FAILED_DELIVERY --> CANCELLED : cancel(reason)

    DELIVERED --> [*]
    RETURNED --> [*]
    CANCELLED --> [*]
```

## 4. Cash-on-Delivery (COD) Status (within `Delivery.codInfo`)

Only present when the delivery was created with a `codAmount > 0`.

```mermaid
stateDiagram-v2
    [*] --> PENDING : delivery created with codAmount > 0

    PENDING --> COLLECTED : cod/collect\n(rider collects cash from recipient,\nrequires DELIVERED)
    COLLECTED --> REMITTED : cod/remit\n(rider hands cash to platform/sender)

    REMITTED --> [*]
```

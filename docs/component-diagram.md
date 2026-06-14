# Component Diagram

High-level view of the system's components and their dependencies: client
applications, the ten backend microservices, the shared message broker, and
each service's persistence/storage.

```mermaid
flowchart TB
    subgraph CLIENTS["Clients"]
        Mobile["Mobile App\n(Android - Courier-Management-system)"]
        AdminUI["Admin Portal\n(Next.js - CourierAdmin)"]
    end

    subgraph SERVICES["Backend Microservices"]
        UserSvc["user-service\n(NestJS, :3001)"]
        TripSvc["trip-service\n(NestJS, :3002)"]
        PricingSvc["pricing-service\n(FastAPI, :3003)"]
        GeoSvc["geo-service\n(NestJS, :3004)"]
        NotifSvc["notification-service\n(NestJS, :3005)"]
        PaymentSvc["payment-service\n(NestJS, :3006)"]
        MatchingSvc["matching-service\n(NestJS, :3007)"]
        RatingSvc["rating-service\n(NestJS, :3008)"]
        RoutingSvc["routing-service\n(NestJS, :3009)"]
        DeliverySvc["delivery-service\n(NestJS, :3010)"]
    end

    subgraph BROKER["Messaging"]
        Kafka["Kafka\n(topics: trip.events, delivery.events, matching.events)"]
    end

    subgraph STORAGE["Persistence"]
        PgUser["postgres-user"]
        PgTrip["postgres-trip"]
        PgDelivery["postgres-delivery"]
        PgPayment["postgres-payment"]
        Redis["redis\n(geo-index)"]
        MlModels["ml-models/\nmoto_cost_model.pkl"]
    end

    %% Client -> service calls
    Mobile -->|REST + WebSocket| TripSvc
    Mobile -->|REST| UserSvc
    Mobile -->|REST| DeliverySvc
    Mobile -->|REST| PaymentSvc
    Mobile -->|REST| GeoSvc

    AdminUI -->|REST| UserSvc
    AdminUI -->|REST| TripSvc
    AdminUI -->|REST| DeliverySvc
    AdminUI -->|REST| PaymentSvc

    %% Synchronous service -> service calls
    TripSvc -->|POST /predict| PricingSvc
    TripSvc -->|hold/release/refund| PaymentSvc
    MatchingSvc -->|GET /nearby| GeoSvc
    MatchingSvc -->|GET /riders/batch| UserSvc

    %% Event-driven (Kafka)
    TripSvc -->|produces trip.events| Kafka
    DeliverySvc -->|produces delivery.events| Kafka
    MatchingSvc -->|produces matching.events| Kafka

    Kafka -->|trip.events| MatchingSvc
    Kafka -->|trip.events| DeliverySvc
    Kafka -->|delivery.events| TripSvc
    Kafka -->|trip.events, delivery.events, matching.events| NotifSvc

    %% Persistence
    UserSvc --> PgUser
    TripSvc --> PgTrip
    DeliverySvc --> PgDelivery
    PaymentSvc --> PgPayment
    GeoSvc --> Redis
    PricingSvc -.->|read-only mount| MlModels
```

## Notes

- **rating-service** and **routing-service** are currently stub services
  (health-check endpoints only) and are included for completeness but have no
  meaningful dependencies yet.
- **pricing-service** is stateless: it loads `moto_cost_model.pkl` from a
  read-only volume at startup and exposes `POST /predict`. Swapping the model
  file and restarting the container is enough to update pricing behaviour
  (see `pricing-service/README.md`).
- Each NestJS service follows clean architecture internally
  (`domain` / `application` / `infrastructure` / `presentation`), and
  trip-service / delivery-service use the **outbox pattern** to publish Kafka
  events transactionally.

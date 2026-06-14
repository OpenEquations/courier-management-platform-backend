# Class Diagram

The platform is split into independently-deployable services, each owning its
own domain model (database-per-service). Cross-service references are plain
ID fields (`passengerId`, `ownerId`, `deliveryId`, ...), shown below as
dependency arrows with `«id ref»` labels rather than object composition.

## 1. User & Identity Domain (`user-service`)

```mermaid
classDiagram
    class User {
        +string id
        +string firstName
        +string lastName
        +Email email
        +NationalId nationalId
        +Gender gender
        +string passwordHash
        +string~nullable~ phone
        +boolean isActive
        +Date createdAt
        +Date updatedAt
        +changeName(first, last)
        +changeEmail(email)
        +changePhone(phone)
        +changePassword(current, new)
        +deactivate()
    }

    class Rider {
        +string id
        +string userId
        +Vehicle[] vehicles
        +boolean isAvailable
        +Date createdAt
        +Date updatedAt
        +addVehicle(vehicle)
        +removeVehicle(licensePlate)
        +setAvailability(isAvailable)
    }

    class Vehicle {
        <<value object>>
        +VehicleType type
        +string licensePlate
    }

    class Email {
        <<value object>>
        +string value
    }

    class NationalId {
        <<value object>>
        +string value
    }

    class Gender {
        <<enumeration>>
        MALE
        FEMALE
        OTHER
    }

    class VehicleType {
        <<enumeration>>
        MOTORCYCLE
        BICYCLE
        CAR
        VAN
        TRUCK
    }

    User "1" --> "1" Email
    User "1" --> "1" NationalId
    User "1" --> "1" Gender
    Rider "1" --> "1" User : userId «id ref»
    Rider "1" --> "*" Vehicle
    Vehicle "1" --> "1" VehicleType
```

## 2. Trip Domain (`trip-service`)

```mermaid
classDiagram
    class Trip {
        +string id
        +TripType type
        +string passengerId «id ref»
        +string~nullable~ riderId «id ref»
        +Location origin
        +Location destination
        +VehicleType requestedVehicleType
        +Vehicle~nullable~ vehicle
        +number predictedPrice
        +number~nullable~ agreedPrice
        +BroadcastStatus broadcastStatus
        +TripStatus tripStatus
        +TimelineEntry[] timeline
        +Payment payment
        +string~nullable~ notes
        +number~nullable~ distance
        +number~nullable~ estimatedDuration
        +string~nullable~ cancellationReason
        +string~nullable~ disputeReason
        +PackageDetails~nullable~ packageDetails
        +string~nullable~ deliveryId «id ref»
        +boolean pickupConfirmed
        +Date createdAt
        +Date updatedAt
        +lockBroadcast(rider, vehicle, agreedPrice)
        +releaseBroadcast()
        +start()
        +confirmPickup()
        +complete()
        +confirmCompletion()
        +cancel(cancelledBy, reason)
        +flagForDispute(flaggedBy, reason)
        +requeue()
        +handoff(newRider, newVehicle)
    }

    class Location {
        <<value object>>
        +number lat
        +number lng
        +string address
    }

    class TimelineEntry {
        <<value object>>
        +string status
        +Date occurredAt
        +string~nullable~ note
    }

    class Payment {
        <<value object>>
        +number amount
        +string currency
        +PaymentStatus status
        +hold()
        +release()
        +refund()
        +isHeld() bool
    }

    class PackageDetails {
        <<value object>>
        +number weightKg
        +string dimensions
        +string description
        +boolean isFragile
    }

    class TripType {
        <<enumeration>>
        STANDARD
        EXPRESS
        SCHEDULED
        PACKAGE
    }

    class TripStatus {
        <<enumeration>>
        PENDING
        ONGOING
        COMPLETED
        CANCELLED
        DISPUTED
    }

    class BroadcastStatus {
        <<enumeration>>
        OPEN
        LOCKED
        CLOSED
    }

    class CancelledBy {
        <<enumeration>>
        CUSTOMER
        RIDER
        SYSTEM
    }

    class PaymentStatus {
        <<enumeration>>
        INITIAL
        HELD
        RELEASED
        REFUNDED
    }

    Trip "1" --> "2" Location : origin / destination
    Trip "1" --> "*" TimelineEntry
    Trip "1" --> "1" Payment
    Trip "0..1" --> "1" PackageDetails
    Trip "1" --> "1" TripType
    Trip "1" --> "1" TripStatus
    Trip "1" --> "1" BroadcastStatus
    Payment "1" --> "1" PaymentStatus
```

## 3. Delivery Domain (`delivery-service`)

```mermaid
classDiagram
    class Delivery {
        +string id
        +string trackingNumber
        +string senderId «id ref»
        +Recipient recipient
        +Location pickupLocation
        +Location dropoffLocation
        +PackageDetails packageDetails
        +TimeWindow~nullable~ deliveryWindow
        +string~nullable~ specialInstructions
        +CodInfo~nullable~ codInfo
        +DeliveryStatus status
        +string~nullable~ currentTripId «id ref»
        +Proof~nullable~ proofOfPickup
        +Proof~nullable~ proofOfDelivery
        +DeliveryAttempt[] attempts
        +TimelineEntry[] timeline
        +string~nullable~ cancellationReason
        +string[] parcelImages
        +string[] pickupImages
        +Date createdAt
        +Date updatedAt
        +assignToTrip(tripId)
        +unassignFromTrip()
        +recordPickup(proof)
        +markInTransit()
        +markOutForDelivery()
        +recordSuccessfulDelivery(proof, riderId)
        +recordFailedAttempt(riderId, reason, notes)
        +returnToSender(reason)
        +cancel(reason)
        +collectCod()
        +remitCod()
    }

    class Recipient {
        <<value object>>
        +string name
        +string phone
    }

    class PackageDetails {
        <<value object>>
        +number weightKg
        +string dimensions
        +string description
        +boolean isFragile
    }

    class TimeWindow {
        <<value object>>
        +Date start
        +Date end
    }

    class CodInfo {
        <<value object>>
        +number amount
        +CodStatus status
    }

    class Proof {
        <<value object>>
        +string type
        +string url
        +Date capturedAt
    }

    class DeliveryAttempt {
        <<value object>>
        +Date attemptedAt
        +string riderId «id ref»
        +boolean successful
        +FailureReason~nullable~ failureReason
        +string~nullable~ notes
    }

    class TimelineEntry {
        <<value object>>
        +string status
        +Date occurredAt
        +string~nullable~ note
    }

    class DeliveryStatus {
        <<enumeration>>
        CREATED
        ASSIGNED
        PICKED_UP
        IN_TRANSIT
        OUT_FOR_DELIVERY
        DELIVERED
        FAILED_DELIVERY
        RETURNED
        CANCELLED
    }

    class FailureReason {
        <<enumeration>>
        RECIPIENT_NOT_HOME
        WRONG_ADDRESS
        REFUSED_DELIVERY
        INACCESSIBLE_LOCATION
        WEATHER_CONDITIONS
        OTHER
    }

    class CodStatus {
        <<enumeration>>
        PENDING
        COLLECTED
        REMITTED
    }

    Delivery "1" --> "1" Recipient
    Delivery "1" --> "2" Location : pickup / dropoff
    Delivery "1" --> "1" PackageDetails
    Delivery "0..1" --> "1" TimeWindow
    Delivery "0..1" --> "1" CodInfo
    Delivery "1" --> "0..2" Proof : pickup / delivery
    Delivery "1" --> "*" DeliveryAttempt
    Delivery "1" --> "*" TimelineEntry
    Delivery "1" --> "1" DeliveryStatus
    CodInfo "1" --> "1" CodStatus
    DeliveryAttempt "0..1" --> "1" FailureReason
```

## 4. Payment Domain (`payment-service`)

```mermaid
classDiagram
    class Account {
        +string id
        +string ownerId «id ref»
        +string ownerName
        +number balance
        +number heldBalance
        +string currency
        +AccountStatus status
        +Date createdAt
        +Date updatedAt
        +credit(amount)
        +debit(amount)
        +hold(amount)
        +release(amount)
        +refund(amount)
        +availableBalance() number
    }

    class Transaction {
        +string id
        +string accountId «id ref»
        +string payerId «id ref»
        +number amount
        +string currency
        +TransactionStatus status
        +string~nullable~ reference
        +Date createdAt
        +Date updatedAt
    }

    class AccountStatus {
        <<enumeration>>
        ACTIVE
        SUSPENDED
    }

    class TransactionStatus {
        <<enumeration>>
        HELD
        RELEASED
        REFUNDED
        TOPUP
        WITHDRAWAL
    }

    Account "1" --> "*" Transaction
    Account "1" --> "1" AccountStatus
    Transaction "1" --> "1" TransactionStatus
```

## 5. Pricing Domain (`pricing-service`, Python / FastAPI)

Clean-architecture layers: `domain` defines the contract, `application` orchestrates,
`infrastructure` implements it against the trained model, `presentation` exposes it over HTTP.

```mermaid
classDiagram
    class PricingInput {
        <<value object>>
        +float distance_km
        +int hour_of_day
        +WeatherCondition weather
    }

    class PriceEstimate {
        <<value object>>
        +float cost
    }

    class WeatherCondition {
        <<enumeration>>
        CLEAR
        LIGHT_RAIN
        HEAVY_RAIN
    }

    class PricePredictor {
        <<interface>>
        +predict(input: PricingInput) PriceEstimate
    }

    class PredictPriceUseCase {
        -PricePredictor predictor
        +execute(input: PricingInput) PriceEstimate
    }

    class SklearnPricePredictor {
        -ModelRepository modelRepository
        +predict(input: PricingInput) PriceEstimate
        -to_features(input) dict
    }

    class ModelRepository {
        -string modelPath
        -model
        +load() model
    }

    class PriceEstimateRequest {
        <<DTO>>
        +float distance_km
        +int hour_of_day
        +WeatherCondition weather
    }

    class PriceEstimateResponse {
        <<DTO>>
        +float cost
    }

    PricingInput "1" --> "1" WeatherCondition
    PredictPriceUseCase --> PricePredictor : depends on
    SklearnPricePredictor ..|> PricePredictor : implements
    SklearnPricePredictor --> ModelRepository
    SklearnPricePredictor ..> PricingInput
    SklearnPricePredictor ..> PriceEstimate
    PriceEstimateRequest ..> PricingInput : maps to
    PriceEstimateResponse ..> PriceEstimate : maps from
```

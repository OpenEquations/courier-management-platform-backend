import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { TripStatus, BroadcastStatus, TripType, PaymentStatus } from 'src/domain/trip/enums';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

@Entity('trips')
export class TripOrmEntity {
  @PrimaryColumn() id!: string;

  @Column({ type: 'enum', enum: TripType }) type!: TripType;

  @Column() passengerId!: string;
  @Column({ nullable: true, type: 'varchar' }) riderId!: string | null;

  @Column({ type: 'float' }) originLat!: number;
  @Column({ type: 'float' }) originLng!: number;
  @Column() originAddress!: string;

  @Column({ type: 'float' }) destinationLat!: number;
  @Column({ type: 'float' }) destinationLng!: number;
  @Column() destinationAddress!: string;

  @Column({ type: 'enum', enum: VehicleType }) requestedVehicleType!: VehicleType;

  @Column({ nullable: true, type: 'varchar' }) vehicleType!: VehicleType | null;
  @Column({ nullable: true, type: 'varchar' }) vehicleLicensePlate!: string | null;

  @Column({ type: 'float' }) predictedPrice!: number;
  @Column({ nullable: true, type: 'float' }) agreedPrice!: number | null;

  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.PENDING })
  tripStatus!: TripStatus;

  @Column({ type: 'enum', enum: BroadcastStatus, default: BroadcastStatus.OPEN })
  broadcastStatus!: BroadcastStatus;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.INITIAL })
  paymentStatus!: PaymentStatus;

  @Column({ type: 'jsonb', default: '[]' })
  paymentSplits!: { riderId: string; portion: number }[];

  @Column({ type: 'jsonb', default: '[]' })
  timeline!: { status: TripStatus; timestamp: string }[];

  @Column({ nullable: true, type: 'text' }) notes!: string | null;
  @Column({ nullable: true, type: 'float' }) distance!: number | null;
  @Column({ nullable: true, type: 'float' }) estimatedDuration!: number | null;
  @Column({ nullable: true, type: 'text' }) cancellationReason!: string | null;
  @Column({ nullable: true, type: 'text' }) disputeReason!: string | null;

  @Column({ nullable: true, type: 'jsonb' })
  packageDetails!: {
    weight: number;
    dimensions: { width: number; height: number; depth: number };
    description: string;
    isFragile: boolean;
  } | null;

  @CreateDateColumn() createdAt!: Date;
  @UpdateDateColumn() updatedAt!: Date;
}

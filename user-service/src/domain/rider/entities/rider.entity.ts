import { User } from 'src/domain/user/entities/user.entity';
import { Vehicle } from '../value-objects/vehicle.vo';
import { DomainException } from 'src/domain/shared/exceptions/domain.exception';
import { ConflictException } from 'src/domain/shared/exceptions/conflict.exception';

export class Rider {
  private constructor(
    private readonly id: string,
    private readonly user: User,
    private vehicles: Vehicle[],
    private isAvailable: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static create(props: {
    id: string;
    user: User;
    vehicle: Vehicle;
  }): Rider {
    return new Rider(
      props.id,
      props.user,
      [props.vehicle],
      true,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    user: User;
    vehicles: Vehicle[];
    isAvailable: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Rider {
    return new Rider(
      props.id,
      props.user,
      props.vehicles,
      props.isAvailable,
      props.createdAt,
      props.updatedAt,
    );
  }

  addVehicle(vehicle: Vehicle): void {
    const exists = this.vehicles.some(v => v.equals(vehicle));
    if (exists) throw new ConflictException("Vehicle already assigned to this rider");

    const plateExists = this.vehicles.some(
      v => v.getLicensePlate() === vehicle.getLicensePlate(),
    );
    if (plateExists) throw new ConflictException("License plate already registered");

    this.vehicles.push(vehicle);
    this.updatedAt = new Date();
  }

  removeVehicle(licensePlate: string): void {
    if (this.vehicles.length <= 1) {
      throw new DomainException("Rider must have at least one vehicle");
    }
    this.vehicles = this.vehicles.filter(
      v => v.getLicensePlate() !== licensePlate,
    );
    this.updatedAt = new Date();
  }

  getVehicles(): Vehicle[] { return [...this.vehicles]; }
  getId(): string { return this.id; }
  getUser(): User { return this.user; }
  getIsAvailable(): boolean { return this.isAvailable; }
}

import { VehicleType } from '../enums/vehicle-type.enum';

export class Vehicle {
  private readonly type: VehicleType;
  private readonly licensePlate: string;

  constructor(type: VehicleType, licensePlate: string) {
    if (!type) throw new Error('Vehicle type cannot be empty');
    if (!licensePlate?.trim()) throw new Error('License plate cannot be empty');
    this.type = type;
    this.licensePlate = licensePlate.trim();
  }

  getType(): VehicleType { return this.type; }
  getLicensePlate(): string { return this.licensePlate; }

  equals(other: Vehicle): boolean {
    return this.type === other.type && this.licensePlate === other.licensePlate;
  }
}

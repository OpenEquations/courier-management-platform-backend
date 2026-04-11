import { Rider } from 'src/domain/rider/entities/rider.entity';

export class RiderResponseDto {
  readonly id: string;
  readonly userId: string;
  readonly vehicleType: string;
  readonly vehiclePlate: string;

  private constructor(props: {
    id: string;
    userId: string;
    vehicleType: string;
    vehiclePlate: string;
  }) {
    this.id = props.id;
    this.userId = props.userId;
    this.vehicleType = props.vehicleType;
    this.vehiclePlate = props.vehiclePlate;
  }

  static fromEntity(rider: Rider): RiderResponseDto {
    return new RiderResponseDto({
      id: rider.getId(),
      userId: rider.getUser().getId(),
      vehicleType: rider.getVehicle().getType(),
      vehiclePlate: rider.getVehicle().getLicensePlate(),
    });
  }
}

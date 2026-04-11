// application/rider/dto/rider-response.dto.ts

import { Rider } from "src/domain/rider/entities/rider.entity";
import { VehicleType } from "src/domain/rider/enums/vehicle-type.enum";

export class RiderResponseDto {
  id!: string;
  userId!: string;
  firstName!: string;
  lastName!: string;
  email!: string;
  vehicles!: { type: VehicleType; licensePlate: string }[];
  isAvailable!: boolean;

  static fromEntity(rider: Rider): RiderResponseDto {
    const dto = new RiderResponseDto();
    dto.id = rider.getId();
    dto.userId = rider.getUser().getId();
    dto.firstName = rider.getUser().getFirstName();
    dto.lastName = rider.getUser().getLastName();
    dto.email = rider.getUser().getEmail().getValue();
    dto.vehicles = rider.getVehicles().map(v => ({
      type: v.getType() as VehicleType,
      licensePlate: v.getLicensePlate(),
    }));
    dto.isAvailable = rider.getIsAvailable();
    return dto;
  }
}
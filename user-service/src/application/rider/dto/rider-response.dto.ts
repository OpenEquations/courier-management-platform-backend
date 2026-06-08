// application/rider/dto/rider-response.dto.ts

import { ApiProperty } from "@nestjs/swagger";
import { Rider } from "src/domain/rider/entities/rider.entity";
import { VehicleType } from "src/domain/rider/enums/vehicle-type.enum";

export class RiderResponseDto {
  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d' })
  id!: string;
  @ApiProperty({ example: '3fa2c1d4-5b6e-4f7a-8c9d-0e1f2a3b4c5d', description: 'The underlying user-service account ID' })
  userId!: string;
  @ApiProperty({ example: 'Joe' })
  firstName!: string;
  @ApiProperty({ example: 'Lebonheur' })
  lastName!: string;
  @ApiProperty({ example: 'joe.lebonheur@example.com' })
  email!: string;
  @ApiProperty({ example: [{ type: 'MOTORCYCLE', licensePlate: 'RAB-123-A' }] })
  vehicles!: { type: VehicleType; licensePlate: string }[];
  @ApiProperty({ example: true, description: 'Whether matching-service can currently offer this rider new trips' })
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
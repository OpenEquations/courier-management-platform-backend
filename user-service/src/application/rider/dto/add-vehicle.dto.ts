// application/rider/dto/add-vehicle.dto.ts

import { IsString, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { VehicleType } from "src/domain/rider/enums/vehicle-type.enum";

export class AddVehicleDto {
  @ApiProperty({ enum: VehicleType, example: VehicleType.CAR })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @ApiProperty({ example: 'RAD-456-B', description: 'Must be unique within this rider\'s fleet' })
  @IsString()
  vehiclePlate!: string;
}
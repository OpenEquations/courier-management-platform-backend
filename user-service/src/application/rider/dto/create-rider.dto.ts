// application/rider/dto/create-rider.dto.ts

import { IsString, IsEnum } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { VehicleType } from "src/domain/rider/enums/vehicle-type.enum";

export class CreateRiderDto {
  @ApiProperty({ enum: VehicleType, example: VehicleType.MOTORCYCLE, description: 'Type of the rider\'s starter vehicle' })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @ApiProperty({ example: 'RAB-123-A', description: 'License plate of the starter vehicle' })
  @IsString()
  vehiclePlate!: string;
}
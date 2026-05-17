// application/rider/dto/create-rider.dto.ts

import { IsString, IsEnum } from "class-validator";
import { VehicleType } from "src/domain/rider/enums/vehicle-type.enum";

export class CreateRiderDto {
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @IsString()
  vehiclePlate!: string;
}
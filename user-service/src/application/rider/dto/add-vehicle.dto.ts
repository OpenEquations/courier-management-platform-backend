// application/rider/dto/add-vehicle.dto.ts

import { IsString, IsEnum } from "class-validator";
import { VehicleType } from "src/domain/rider/enums/vehicle-type.enum";

export class AddVehicleDto {
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @IsString()
  vehiclePlate!: string;
}
import { IsString, IsNotEmpty, IsEnum, IsNumber, Min } from 'class-validator';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

export class HandoffTripDto {
  @IsString() @IsNotEmpty() fromRiderId!: string;
  @IsString() @IsNotEmpty() toRiderId!: string;
  @IsEnum(VehicleType) newVehicleType!: VehicleType;
  @IsString() @IsNotEmpty() newVehicleLicensePlate!: string;
  @IsNumber() @Min(0) portionCompleted!: number;
}

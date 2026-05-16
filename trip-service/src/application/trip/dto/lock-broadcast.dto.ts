import { IsString, IsNotEmpty, IsEnum, IsNumber, Min } from 'class-validator';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

export class LockBroadcastDto {
  @IsString() @IsNotEmpty() riderId!: string;
  @IsEnum(VehicleType) vehicleType!: VehicleType;
  @IsString() @IsNotEmpty() vehicleLicensePlate!: string;
  @IsNumber() @Min(0.01) agreedPrice!: number;
}

import { IsString, IsNotEmpty, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

export class LockBroadcastDto {
  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d', description: 'UUID of the rider accepting the offer' })
  @IsString() @IsNotEmpty() riderId!: string;
  @ApiProperty({ enum: VehicleType, example: VehicleType.MOTORCYCLE })
  @IsEnum(VehicleType) vehicleType!: VehicleType;
  @ApiProperty({ example: 'RAB-123-A' })
  @IsString() @IsNotEmpty() vehicleLicensePlate!: string;
  @ApiProperty({ example: 14.32, description: 'Final price both parties agree to for this trip' })
  @IsNumber() @Min(0.01) agreedPrice!: number;
}

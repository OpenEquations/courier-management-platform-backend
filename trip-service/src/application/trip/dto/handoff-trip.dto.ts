import { IsString, IsNotEmpty, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

export class HandoffTripDto {
  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d', description: 'UUID of the rider handing the trip off' })
  @IsString() @IsNotEmpty() fromRiderId!: string;
  @ApiProperty({ example: '9d2f0c3b-bbbb-4f7a-8c9d-0e1f2a3b4c5d', description: 'UUID of the rider taking over' })
  @IsString() @IsNotEmpty() toRiderId!: string;
  @ApiProperty({ enum: VehicleType, example: VehicleType.CAR })
  @IsEnum(VehicleType) newVehicleType!: VehicleType;
  @ApiProperty({ example: 'RAC-789-C' })
  @IsString() @IsNotEmpty() newVehicleLicensePlate!: string;
  @ApiProperty({ example: 0.6, description: 'Fraction (0-1) of the trip completed by the outgoing rider — used to split payment fairly' })
  @IsNumber() @Min(0) portionCompleted!: number;
}

import {
  IsString, IsNumber, IsBoolean, IsEnum, IsNotEmpty,
  IsOptional, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripType } from 'src/domain/trip/enums/trip-type.enum';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

class DimensionsDto {
  @ApiProperty({ example: 30 }) @IsNumber() @Min(0) width!: number;
  @ApiProperty({ example: 20 }) @IsNumber() @Min(0) height!: number;
  @ApiProperty({ example: 15 }) @IsNumber() @Min(0) depth!: number;
}

class PackageDetailsDto {
  @ApiProperty({ example: 2.5, description: 'Weight in kilograms' }) @IsNumber() @Min(0.01) weight!: number;
  @ApiProperty({ type: DimensionsDto }) @ValidateNested() @Type(() => DimensionsDto) dimensions!: DimensionsDto;
  @ApiProperty({ example: 'Fragile electronics — laptop' }) @IsString() @IsNotEmpty() description!: string;
  @ApiProperty({ example: true }) @IsBoolean() isFragile!: boolean;
}

export class CreateTripDto {
  @ApiProperty({ enum: TripType, example: TripType.STANDARD, description: 'STANDARD/EXPRESS = ride trips, PACKAGE = courier delivery, SCHEDULED = book for later' })
  @IsEnum(TripType) type!: TripType;

  @ApiProperty({ example: -1.9441, description: 'Pickup latitude' }) @IsNumber() originLat!: number;
  @ApiProperty({ example: 30.0619, description: 'Pickup longitude' }) @IsNumber() originLng!: number;
  @ApiProperty({ example: 'KN 4 Ave, Kigali' }) @IsString() @IsNotEmpty() originAddress!: string;

  @ApiProperty({ example: -1.9706, description: 'Drop-off latitude' }) @IsNumber() destinationLat!: number;
  @ApiProperty({ example: 30.1044, description: 'Drop-off longitude' }) @IsNumber() destinationLng!: number;
  @ApiProperty({ example: 'Kigali Heights, KG 7 Ave' }) @IsString() @IsNotEmpty() destinationAddress!: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.MOTORCYCLE, description: 'Vehicle type the passenger is requesting' })
  @IsEnum(VehicleType) requestedVehicleType!: VehicleType;

  @ApiProperty({ example: 14.32, description: "Quote obtained from pricing-service's POST /predict — shown to the passenger before they confirm" })
  @IsNumber() @Min(0.01) predictedPrice!: number;

  @ApiPropertyOptional({ example: 'Please call when you arrive' }) @IsString() @IsOptional() notes?: string;
  @ApiPropertyOptional({ example: 5.5, description: 'Distance in kilometers (e.g. from a routing/maps provider)' }) @IsNumber() @IsOptional() distance?: number;
  @ApiPropertyOptional({ example: 18, description: 'Estimated duration in minutes' }) @IsNumber() @IsOptional() estimatedDuration?: number;

  @ApiPropertyOptional({ type: PackageDetailsDto, description: 'Required for PACKAGE-type trips' })
  @ValidateNested() @Type(() => PackageDetailsDto) @IsOptional() packageDetails?: PackageDetailsDto;

  @ApiPropertyOptional({ example: 'a1b2c3d4-...', description: 'Links this trip to a delivery created in delivery-service (PACKAGE trips)' })
  @IsString() @IsOptional() deliveryId?: string;
}

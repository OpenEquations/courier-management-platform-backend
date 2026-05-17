import {
  IsString, IsNumber, IsBoolean, IsEnum, IsNotEmpty,
  IsOptional, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TripType } from 'src/domain/trip/enums/trip-type.enum';
import { VehicleType } from 'src/domain/rider/enums/vehicle-type.enum';

class DimensionsDto {
  @IsNumber() @Min(0) width!: number;
  @IsNumber() @Min(0) height!: number;
  @IsNumber() @Min(0) depth!: number;
}

class PackageDetailsDto {
  @IsNumber() @Min(0.01) weight!: number;
  @ValidateNested() @Type(() => DimensionsDto) dimensions!: DimensionsDto;
  @IsString() @IsNotEmpty() description!: string;
  @IsBoolean() isFragile!: boolean;
}

export class CreateTripDto {
  @IsEnum(TripType) type!: TripType;

  @IsNumber() originLat!: number;
  @IsNumber() originLng!: number;
  @IsString() @IsNotEmpty() originAddress!: string;

  @IsNumber() destinationLat!: number;
  @IsNumber() destinationLng!: number;
  @IsString() @IsNotEmpty() destinationAddress!: string;

  @IsEnum(VehicleType) requestedVehicleType!: VehicleType;

  @IsNumber() @Min(0.01) predictedPrice!: number;

  @IsString() @IsOptional() notes?: string;
  @IsNumber() @IsOptional() distance?: number;
  @IsNumber() @IsOptional() estimatedDuration?: number;

  @ValidateNested() @Type(() => PackageDetailsDto) @IsOptional() packageDetails?: PackageDetailsDto;
}

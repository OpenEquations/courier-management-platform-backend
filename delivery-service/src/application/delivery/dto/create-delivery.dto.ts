import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class SenderDto {
  @IsUUID()
  id!: string;

  @IsString() @IsNotEmpty()
  name!: string;

  @IsString() @IsNotEmpty()
  phone!: string;

  @IsEmail()
  email!: string;
}

class RecipientDto {
  @IsString() @IsNotEmpty()
  name!: string;

  @IsString() @IsNotEmpty()
  phone!: string;

  @IsOptional() @IsEmail()
  email?: string;
}

class LocationDto {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsString() @IsNotEmpty()
  address!: string;
}

class PackageDetailsDto {
  @IsString() @IsNotEmpty()
  description!: string;

  @IsNumber() @IsPositive()
  weightKg!: number;

  @IsOptional() @IsNumber() @IsPositive()
  lengthCm?: number;

  @IsOptional() @IsNumber() @IsPositive()
  widthCm?: number;

  @IsOptional() @IsNumber() @IsPositive()
  heightCm?: number;

  @IsOptional() @IsBoolean()
  isFragile?: boolean;
}

class TimeWindowDto {
  @Type(() => Date)
  from!: Date;

  @Type(() => Date)
  to!: Date;
}

export class CreateDeliveryDto {
  @ValidateNested()
  @Type(() => SenderDto)
  sender!: SenderDto;

  @ValidateNested()
  @Type(() => RecipientDto)
  recipient!: RecipientDto;

  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation!: LocationDto;

  @ValidateNested()
  @Type(() => LocationDto)
  dropoffLocation!: LocationDto;

  @ValidateNested()
  @Type(() => PackageDetailsDto)
  packageDetails!: PackageDetailsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TimeWindowDto)
  deliveryWindow?: TimeWindowDto;

  @IsOptional() @IsString()
  specialInstructions?: string;

  @IsOptional() @IsNumber() @IsPositive()
  codAmount?: number;
}

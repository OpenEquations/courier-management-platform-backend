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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class SenderDto {
  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d', description: 'Sender UUID (from user-service)' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'Aline Uwase' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+250788123456' })
  @IsString() @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: 'aline.uwase@example.com' })
  @IsEmail()
  email!: string;
}

class RecipientDto {
  @ApiProperty({ example: 'Eric Niyonsenga' })
  @IsString() @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '+250788654321' })
  @IsString() @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: 'eric.niyonsenga@example.com' })
  @IsOptional() @IsEmail()
  email?: string;
}

class LocationDto {
  @ApiProperty({ example: -1.9441, description: 'Latitude (WGS84)' })
  @IsNumber()
  lat!: number;

  @ApiProperty({ example: 30.0619, description: 'Longitude (WGS84)' })
  @IsNumber()
  lng!: number;

  @ApiProperty({ example: 'KN 4 Ave, Kigali' })
  @IsString() @IsNotEmpty()
  address!: string;
}

class PackageDetailsDto {
  @ApiProperty({ example: 'Sealed envelope with legal documents' })
  @IsString() @IsNotEmpty()
  description!: string;

  @ApiProperty({ example: 1.5, description: 'Package weight in kilograms' })
  @IsNumber() @IsPositive()
  weightKg!: number;

  @ApiPropertyOptional({ example: 30, description: 'Length in centimeters' })
  @IsOptional() @IsNumber() @IsPositive()
  lengthCm?: number;

  @ApiPropertyOptional({ example: 20, description: 'Width in centimeters' })
  @IsOptional() @IsNumber() @IsPositive()
  widthCm?: number;

  @ApiPropertyOptional({ example: 5, description: 'Height in centimeters' })
  @IsOptional() @IsNumber() @IsPositive()
  heightCm?: number;

  @ApiPropertyOptional({ example: false, description: 'Whether the package needs careful/fragile handling' })
  @IsOptional() @IsBoolean()
  isFragile?: boolean;
}

class TimeWindowDto {
  @ApiProperty({ example: '2026-06-08T14:00:00Z', description: 'Earliest acceptable delivery time (ISO-8601)' })
  @Type(() => Date)
  from!: Date;

  @ApiProperty({ example: '2026-06-08T18:00:00Z', description: 'Latest acceptable delivery time (ISO-8601)' })
  @Type(() => Date)
  to!: Date;
}

export class CreateDeliveryDto {
  @ApiProperty({ description: 'Who is shipping the package', type: SenderDto })
  @ValidateNested()
  @Type(() => SenderDto)
  sender!: SenderDto;

  @ApiProperty({ description: 'Who should receive the package', type: RecipientDto })
  @ValidateNested()
  @Type(() => RecipientDto)
  recipient!: RecipientDto;

  @ApiProperty({ description: 'Where the courier should collect the package', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  pickupLocation!: LocationDto;

  @ApiProperty({ description: 'Where the package should be delivered', type: LocationDto })
  @ValidateNested()
  @Type(() => LocationDto)
  dropoffLocation!: LocationDto;

  @ApiProperty({ description: 'Physical characteristics of the parcel', type: PackageDetailsDto })
  @ValidateNested()
  @Type(() => PackageDetailsDto)
  packageDetails!: PackageDetailsDto;

  @ApiPropertyOptional({ description: 'Optional preferred delivery window', type: TimeWindowDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => TimeWindowDto)
  deliveryWindow?: TimeWindowDto;

  @ApiPropertyOptional({ example: 'Leave with the front-desk security guard if recipient is unavailable' })
  @IsOptional() @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional({ example: 15000, description: 'Amount (in local currency) the courier must collect from the recipient on delivery' })
  @IsOptional() @IsNumber() @IsPositive()
  codAmount?: number;
}

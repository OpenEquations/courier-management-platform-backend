import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateLocationDto {
  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d', description: 'Rider UUID (from user-service)' })
  @IsString() riderId!: string;
  @ApiProperty({ example: -1.9441, description: 'Current latitude (WGS84)' })
  @IsNumber() @Type(() => Number) lat!: number;
  @ApiProperty({ example: 30.0619, description: 'Current longitude (WGS84)' })
  @IsNumber() @Type(() => Number) lng!: number;
  @ApiPropertyOptional({ example: 87, description: 'Compass heading in degrees (0-360), if available' })
  @IsNumber() @IsOptional() @Type(() => Number) heading?: number;
  @ApiPropertyOptional({ example: '2026-06-08T17:32:00Z', description: 'ISO-8601 timestamp the position was captured at' })
  @IsString() @IsOptional() timestamp?: string;
}

import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NearbyQueryDto {
  @ApiProperty({ example: -1.9441, description: 'Search origin latitude (WGS84)' })
  @IsNumber() @Type(() => Number) lat!: number;
  @ApiProperty({ example: 30.0619, description: 'Search origin longitude (WGS84)' })
  @IsNumber() @Type(() => Number) lng!: number;
  @ApiPropertyOptional({ example: 5, description: 'Search radius in kilometers (default 5)' })
  @IsNumber() @IsOptional() @Type(() => Number) radiusKm?: number;
  @ApiPropertyOptional({ example: 20, description: 'Max number of riders to return (default 20)' })
  @IsNumber() @IsOptional() @Type(() => Number) limit?: number;
}

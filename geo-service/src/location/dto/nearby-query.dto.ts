import { IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class NearbyQueryDto {
  @IsNumber() @Type(() => Number) lat!: number;
  @IsNumber() @Type(() => Number) lng!: number;
  @IsNumber() @IsOptional() @Type(() => Number) radiusKm?: number;
  @IsNumber() @IsOptional() @Type(() => Number) limit?: number;
}

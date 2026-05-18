import { IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateLocationDto {
  @IsString() riderId!: string;
  @IsNumber() @Type(() => Number) lat!: number;
  @IsNumber() @Type(() => Number) lng!: number;
  @IsNumber() @IsOptional() @Type(() => Number) heading?: number;
  @IsString() @IsOptional() timestamp?: string;
}

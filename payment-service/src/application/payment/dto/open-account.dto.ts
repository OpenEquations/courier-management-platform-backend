// application/payment/dto/open-account.dto.ts

import { IsString, IsOptional, IsNumber, Min, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenAccountDto {
  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d', description: 'User UUID (from user-service) who owns this wallet' })
  @IsString()
  @MinLength(1)
  ownerId!: string;

  @ApiProperty({ example: 'Aline Uwase', description: 'Display name for statements/receipts' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  ownerName!: string;

  @ApiPropertyOptional({ example: 'RWF', description: '3-letter ISO 4217 currency code (defaults to RWF)' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  @ApiPropertyOptional({ example: 50000, description: 'Initial credit to add to the account at creation time' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;
}

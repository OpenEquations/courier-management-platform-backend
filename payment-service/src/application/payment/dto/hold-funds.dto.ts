// application/payment/dto/hold-funds.dto.ts

import { IsString, IsNumber, IsOptional, Min, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HoldFundsDto {
  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d', description: 'User UUID of the payer (the passenger); must have a wallet account with sufficient available balance' })
  @IsString()
  userId!: string;

  @ApiProperty({ example: 3500, description: 'Amount to earmark (in the account currency)' })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'RWF', description: '3-letter ISO 4217 currency code — must match the account currency' })
  @IsString()
  @Matches(/^[A-Za-z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency!: string;

  @ApiPropertyOptional({ example: 'TRIP-a1b2c3d4', description: 'Optional opaque reference (e.g. trip ID) attached to this transaction for correlation' })
  @IsOptional()
  @IsString()
  reference?: string;
}

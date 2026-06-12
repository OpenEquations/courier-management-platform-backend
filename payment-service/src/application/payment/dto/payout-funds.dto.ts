// application/payment/dto/payout-funds.dto.ts

import { IsString, IsNumber, Min, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PayoutFundsDto {
  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d', description: 'User UUID of the recipient (e.g. the rider); a wallet account is provisioned automatically if none exists' })
  @IsString()
  userId!: string;

  @ApiProperty({ example: 3500, description: 'Amount to credit to the recipient (in the account currency)' })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty({ example: 'RWF', description: '3-letter ISO 4217 currency code — must match the account currency' })
  @IsString()
  @Matches(/^[A-Za-z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency!: string;
}

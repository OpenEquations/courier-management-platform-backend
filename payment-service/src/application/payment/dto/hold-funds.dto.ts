// application/payment/dto/hold-funds.dto.ts

import { IsString, IsNumber, IsOptional, Min, Matches } from 'class-validator';

export class HoldFundsDto {
  @IsString()
  userId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @Matches(/^[A-Za-z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency!: string;

  @IsOptional()
  @IsString()
  reference?: string;
}

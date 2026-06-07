// application/payment/dto/open-account.dto.ts

import { IsString, IsOptional, IsNumber, Min, MinLength, MaxLength, Matches } from 'class-validator';

export class OpenAccountDto {
  @IsString()
  @MinLength(1)
  ownerId!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  ownerName!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  openingBalance?: number;
}

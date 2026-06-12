// application/payment/dto/withdraw.dto.ts

import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class WithdrawDto {
  @ApiProperty({ example: 10000, description: 'Amount to debit from the available balance (in the account currency, e.g. RWF)' })
  @IsNumber()
  @Min(0.01)
  amount!: number;
}

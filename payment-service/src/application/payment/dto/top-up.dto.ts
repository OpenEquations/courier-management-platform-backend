// application/payment/dto/top-up.dto.ts

import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TopUpDto {
  @ApiProperty({ example: 20000, description: 'Amount to credit (in the account currency, e.g. RWF)' })
  @IsNumber()
  @Min(0.01)
  amount!: number;
}

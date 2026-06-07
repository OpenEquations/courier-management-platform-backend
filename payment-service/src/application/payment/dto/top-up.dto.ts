// application/payment/dto/top-up.dto.ts

import { IsNumber, Min } from 'class-validator';

export class TopUpDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;
}

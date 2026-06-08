// application/payment/dto/transaction-response.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transaction } from 'src/domain/payment/entities/transaction.entity';
import { TransactionStatus } from 'src/domain/payment/enums/transaction-status.enum';

export class TransactionResponseDto {
  @ApiProperty({ description: 'Transaction UUID', example: 't1u2v3w4-...' })
  id!: string;
  @ApiProperty({ description: 'UUID of the wallet account this transaction belongs to', example: 'a1b2c3d4-...' })
  accountId!: string;
  @ApiProperty({ description: 'UUID of the user whose funds were held', example: '7c1e9b2a-...' })
  payerId!: string;
  @ApiProperty({ example: 3500, description: 'Amount held/released/refunded' })
  amount!: number;
  @ApiProperty({ example: 'RWF', description: '3-letter ISO 4217 currency code' })
  currency!: string;
  @ApiProperty({ enum: TransactionStatus, description: 'Current state of the hold' })
  status!: TransactionStatus;
  @ApiPropertyOptional({ example: 'TRIP-a1b2c3d4', description: 'Correlation reference supplied at hold time', nullable: true })
  reference!: string | null;
  @ApiProperty()
  createdAt!: Date;
  @ApiProperty()
  updatedAt!: Date;

  static fromEntity(transaction: Transaction): TransactionResponseDto {
    const dto = new TransactionResponseDto();
    dto.id = transaction.getId();
    dto.accountId = transaction.getAccountId();
    dto.payerId = transaction.getPayerId();
    dto.amount = transaction.getAmount();
    dto.currency = transaction.getCurrency();
    dto.status = transaction.getStatus();
    dto.reference = transaction.getReference();
    dto.createdAt = transaction.getCreatedAt();
    dto.updatedAt = transaction.getUpdatedAt();
    return dto;
  }
}

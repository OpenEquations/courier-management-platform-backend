// application/payment/dto/transaction-response.dto.ts

import { Transaction } from 'src/domain/payment/entities/transaction.entity';
import { TransactionStatus } from 'src/domain/payment/enums/transaction-status.enum';

export class TransactionResponseDto {
  id!: string;
  accountId!: string;
  payerId!: string;
  amount!: number;
  currency!: string;
  status!: TransactionStatus;
  reference!: string | null;
  createdAt!: Date;
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

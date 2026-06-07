// application/payment/dto/account-response.dto.ts

import { Account } from 'src/domain/payment/entities/account.entity';
import { AccountStatus } from 'src/domain/payment/enums/account-status.enum';

export class AccountResponseDto {
  id!: string;
  ownerId!: string;
  ownerName!: string;
  balance!: number;
  heldBalance!: number;
  availableBalance!: number;
  currency!: string;
  status!: AccountStatus;
  createdAt!: Date;
  updatedAt!: Date;

  static fromEntity(account: Account): AccountResponseDto {
    const dto = new AccountResponseDto();
    dto.id = account.getId();
    dto.ownerId = account.getOwnerId();
    dto.ownerName = account.getOwnerName();
    dto.balance = account.getBalance();
    dto.heldBalance = account.getHeldBalance();
    dto.availableBalance = account.getAvailableBalance();
    dto.currency = account.getCurrency();
    dto.status = account.getStatus();
    dto.createdAt = account.getCreatedAt();
    dto.updatedAt = account.getUpdatedAt();
    return dto;
  }
}

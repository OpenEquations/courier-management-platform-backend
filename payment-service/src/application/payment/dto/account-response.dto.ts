// application/payment/dto/account-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { Account } from 'src/domain/payment/entities/account.entity';
import { AccountStatus } from 'src/domain/payment/enums/account-status.enum';

export class AccountResponseDto {
  @ApiProperty({ description: 'Account UUID', example: 'a1b2c3d4-...' })
  id!: string;
  @ApiProperty({ description: 'User UUID of the wallet owner', example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d' })
  ownerId!: string;
  @ApiProperty({ example: 'Aline Uwase' })
  ownerName!: string;
  @ApiProperty({ example: 50000, description: 'Total balance (held + available)' })
  balance!: number;
  @ApiProperty({ example: 3500, description: 'Amount currently earmarked for ongoing trips' })
  heldBalance!: number;
  @ApiProperty({ example: 46500, description: 'Funds available for new holds (balance − heldBalance)' })
  availableBalance!: number;
  @ApiProperty({ example: 'RWF', description: '3-letter ISO 4217 currency code' })
  currency!: string;
  @ApiProperty({ enum: AccountStatus, description: 'Whether the account is usable' })
  status!: AccountStatus;
  @ApiProperty()
  createdAt!: Date;
  @ApiProperty()
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

import { Injectable, Inject } from '@nestjs/common';
import type { IAccountRepository } from 'src/domain/payment/interfaces/repositories/account.repository.interface';
import type { ITransactionRepository } from 'src/domain/payment/interfaces/repositories/transaction.repository.interface';
import { Account } from 'src/domain/payment/entities/account.entity';
import { Transaction } from 'src/domain/payment/entities/transaction.entity';
import { Money } from 'src/domain/payment/value-objects/money.vo';
import { PaginatedResult } from 'src/domain/shared/interfaces/paginated-result.interface';
import { NotFoundException } from 'src/domain/shared/exceptions/not-found.exception';
import { ConflictException } from 'src/domain/shared/exceptions/conflict.exception';
import { generateId } from 'src/application/shared/utils/id-generator';
import { OpenAccountDto } from './dto/open-account.dto';
import { HoldFundsDto } from './dto/hold-funds.dto';
import { AccountResponseDto } from './dto/account-response.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';

// A sandbox payment gateway: every payer gets a mock bank account seeded
// with play money the first time it is touched, so hold/release/refund
// flows can be exercised end-to-end without a real banking integration.
// Swapping this service for a genuine PSP later only requires the caller
// (e.g. trip-service's IPaymentGatewayPort adapter) to point at a new URL —
// the contract (hold/release/refund -> transaction) stays the same.
const DEFAULT_CURRENCY = 'USD';
const SANDBOX_OPENING_BALANCE = 1_000_000;

@Injectable()
export class PaymentService {
  constructor(
    @Inject('IAccountRepository') private readonly accountRepository: IAccountRepository,
    @Inject('ITransactionRepository') private readonly transactionRepository: ITransactionRepository,
  ) {}

  async openAccount(dto: OpenAccountDto): Promise<AccountResponseDto> {
    const existing = await this.accountRepository.findByOwnerId(dto.ownerId);
    if (existing) throw new ConflictException('Account already exists for this owner');

    const account = Account.open({
      id: generateId(),
      ownerId: dto.ownerId,
      ownerName: dto.ownerName,
      currency: (dto.currency ?? DEFAULT_CURRENCY).toUpperCase(),
      openingBalance: dto.openingBalance ?? SANDBOX_OPENING_BALANCE,
    });

    await this.accountRepository.save(account);
    return AccountResponseDto.fromEntity(account);
  }

  async getAccount(id: string): Promise<AccountResponseDto> {
    const account = await this.accountRepository.findById(id);
    if (!account) throw new NotFoundException('Account not found');
    return AccountResponseDto.fromEntity(account);
  }

  async getAccountByOwner(ownerId: string): Promise<AccountResponseDto> {
    const account = await this.accountRepository.findByOwnerId(ownerId);
    if (!account) throw new NotFoundException('Account not found for this owner');
    return AccountResponseDto.fromEntity(account);
  }

  async topUp(accountId: string, amount: number): Promise<AccountResponseDto> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) throw new NotFoundException('Account not found');

    account.deposit(amount);
    await this.accountRepository.update(account);
    return AccountResponseDto.fromEntity(account);
  }

  // Earmarks funds on the payer's account and opens a HELD transaction.
  // Mirrors IPaymentGatewayPort.hold(userId, amount, currency) -> transactionId.
  async hold(dto: HoldFundsDto): Promise<TransactionResponseDto> {
    const money = new Money(dto.amount, dto.currency);
    const account = await this.getOrProvisionAccount(dto.userId, money.getCurrency());

    if (account.getCurrency() !== money.getCurrency()) {
      throw new ConflictException(
        `Account is denominated in ${account.getCurrency()}, cannot hold ${money.getCurrency()}`,
      );
    }
    if (account.getAvailableBalance() < money.getAmount()) {
      throw new ConflictException('Insufficient available balance to place hold');
    }

    account.hold(money.getAmount());

    const transaction = Transaction.open({
      id: generateId(),
      accountId: account.getId(),
      payerId: dto.userId,
      amount: money.getAmount(),
      currency: money.getCurrency(),
      reference: dto.reference,
    });

    await this.accountRepository.update(account);
    await this.transactionRepository.save(transaction);
    return TransactionResponseDto.fromEntity(transaction);
  }

  // Captures a held transaction: funds permanently leave the payer's account.
  async release(transactionId: string): Promise<TransactionResponseDto> {
    const transaction = await this.requireHeldTransaction(transactionId);
    const account = await this.requireAccount(transaction.getAccountId());

    account.release(transaction.getAmount());
    transaction.release();

    await this.accountRepository.update(account);
    await this.transactionRepository.update(transaction);
    return TransactionResponseDto.fromEntity(transaction);
  }

  // Cancels a held transaction: earmarked funds become available again.
  async refund(transactionId: string): Promise<TransactionResponseDto> {
    const transaction = await this.requireHeldTransaction(transactionId);
    const account = await this.requireAccount(transaction.getAccountId());

    account.refund(transaction.getAmount());
    transaction.refund();

    await this.accountRepository.update(account);
    await this.transactionRepository.update(transaction);
    return TransactionResponseDto.fromEntity(transaction);
  }

  async getTransaction(id: string): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) throw new NotFoundException('Transaction not found');
    return TransactionResponseDto.fromEntity(transaction);
  }

  async listTransactions(
    accountId: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<TransactionResponseDto>> {
    const account = await this.requireAccount(accountId);
    const result = await this.transactionRepository.findByAccountId(account.getId(), page, limit);
    return { ...result, data: result.data.map(TransactionResponseDto.fromEntity) };
  }

  private async getOrProvisionAccount(ownerId: string, currency: string): Promise<Account> {
    const existing = await this.accountRepository.findByOwnerId(ownerId);
    if (existing) return existing;

    const account = Account.open({
      id: generateId(),
      ownerId,
      ownerName: `Sandbox account for ${ownerId}`,
      currency,
      openingBalance: SANDBOX_OPENING_BALANCE,
    });
    await this.accountRepository.save(account);
    return account;
  }

  private async requireAccount(id: string): Promise<Account> {
    const account = await this.accountRepository.findById(id);
    if (!account) throw new NotFoundException('Account not found');
    return account;
  }

  private async requireHeldTransaction(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (!transaction.isHeld()) {
      throw new ConflictException(`Transaction is already ${transaction.getStatus().toLowerCase()}`);
    }
    return transaction;
  }
}

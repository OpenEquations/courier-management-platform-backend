import { AccountStatus } from '../enums/account-status.enum';

// A mock bank account standing in for a real banking/PSP integration.
// Every payer known to the gateway gets one of these, seeded with play
// money, so the rest of the system can exercise hold/release/refund flows
// exactly as it would against a real provider.
export class Account {
  private constructor(
    private readonly id: string,
    private readonly ownerId: string,
    private ownerName: string,
    private balance: number,
    private heldBalance: number,
    private readonly currency: string,
    private status: AccountStatus,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static open(props: {
    id: string;
    ownerId: string;
    ownerName: string;
    currency: string;
    openingBalance: number;
  }): Account {
    return new Account(
      props.id,
      props.ownerId,
      props.ownerName,
      props.openingBalance,
      0,
      props.currency,
      AccountStatus.ACTIVE,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    ownerId: string;
    ownerName: string;
    balance: number;
    heldBalance: number;
    currency: string;
    status: AccountStatus;
    createdAt: Date;
    updatedAt: Date;
  }): Account {
    return new Account(
      props.id,
      props.ownerId,
      props.ownerName,
      props.balance,
      props.heldBalance,
      props.currency,
      props.status,
      props.createdAt,
      props.updatedAt,
    );
  }

  getAvailableBalance(): number {
    return this.balance - this.heldBalance;
  }

  // Earmarks funds for a pending charge without moving them out of the account yet.
  hold(amount: number): void {
    this.assertActive();
    if (amount <= 0) throw new Error('Hold amount must be positive');
    if (this.getAvailableBalance() < amount) {
      throw new Error('Insufficient available balance');
    }
    this.heldBalance += amount;
    this.touch();
  }

  // Captures previously-held funds: they leave the account for good.
  release(amount: number): void {
    if (amount <= 0) throw new Error('Release amount must be positive');
    if (this.heldBalance < amount) throw new Error('Cannot release more than is held');
    this.heldBalance -= amount;
    this.balance -= amount;
    this.touch();
  }

  // Cancels a hold: the earmarked funds become available again.
  refund(amount: number): void {
    if (amount <= 0) throw new Error('Refund amount must be positive');
    if (this.heldBalance < amount) throw new Error('Cannot refund more than is held');
    this.heldBalance -= amount;
    this.touch();
  }

  deposit(amount: number): void {
    if (amount <= 0) throw new Error('Deposit amount must be positive');
    this.balance += amount;
    this.touch();
  }

  // Withdraws from the available (non-held) balance — e.g. a rider cashing out earnings.
  withdraw(amount: number): void {
    if (amount <= 0) throw new Error('Withdrawal amount must be positive');
    if (this.getAvailableBalance() < amount) {
      throw new Error('Insufficient available balance');
    }
    this.balance -= amount;
    this.touch();
  }

  suspend(): void {
    this.status = AccountStatus.SUSPENDED;
    this.touch();
  }

  activate(): void {
    this.status = AccountStatus.ACTIVE;
    this.touch();
  }

  private assertActive(): void {
    if (this.status !== AccountStatus.ACTIVE) {
      throw new Error('Account is not active');
    }
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  getId(): string {
    return this.id;
  }
  getOwnerId(): string {
    return this.ownerId;
  }
  getOwnerName(): string {
    return this.ownerName;
  }
  getBalance(): number {
    return this.balance;
  }
  getHeldBalance(): number {
    return this.heldBalance;
  }
  getCurrency(): string {
    return this.currency;
  }
  getStatus(): AccountStatus {
    return this.status;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}

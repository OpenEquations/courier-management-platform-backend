import { TransactionStatus } from '../enums/transaction-status.enum';

// Mirrors the lifecycle a real payment-gateway transaction goes through:
// funds are first held against the payer's account, then either released
// (captured — money moves to the payee) or refunded (hold cancelled).
export class Transaction {
  private constructor(
    private readonly id: string,
    private readonly accountId: string,
    private readonly payerId: string,
    private readonly amount: number,
    private readonly currency: string,
    private status: TransactionStatus,
    private readonly reference: string | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  static open(props: {
    id: string;
    accountId: string;
    payerId: string;
    amount: number;
    currency: string;
    reference?: string | null;
  }): Transaction {
    return new Transaction(
      props.id,
      props.accountId,
      props.payerId,
      props.amount,
      props.currency,
      TransactionStatus.HELD,
      props.reference ?? null,
      new Date(),
      new Date(),
    );
  }

  // Records an already-settled, one-shot transaction (e.g. a top-up or withdrawal)
  // that doesn't go through the hold -> release/refund lifecycle.
  static record(props: {
    id: string;
    accountId: string;
    payerId: string;
    amount: number;
    currency: string;
    status: TransactionStatus;
    reference?: string | null;
  }): Transaction {
    return new Transaction(
      props.id,
      props.accountId,
      props.payerId,
      props.amount,
      props.currency,
      props.status,
      props.reference ?? null,
      new Date(),
      new Date(),
    );
  }

  static reconstitute(props: {
    id: string;
    accountId: string;
    payerId: string;
    amount: number;
    currency: string;
    status: TransactionStatus;
    reference: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Transaction {
    return new Transaction(
      props.id,
      props.accountId,
      props.payerId,
      props.amount,
      props.currency,
      props.status,
      props.reference,
      props.createdAt,
      props.updatedAt,
    );
  }

  release(): void {
    this.assertHeld();
    this.status = TransactionStatus.RELEASED;
    this.touch();
  }

  refund(): void {
    this.assertHeld();
    this.status = TransactionStatus.REFUNDED;
    this.touch();
  }

  isHeld(): boolean {
    return this.status === TransactionStatus.HELD;
  }

  private assertHeld(): void {
    if (this.status !== TransactionStatus.HELD) {
      throw new Error(`Transaction is already ${this.status.toLowerCase()}`);
    }
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  getId(): string {
    return this.id;
  }
  getAccountId(): string {
    return this.accountId;
  }
  getPayerId(): string {
    return this.payerId;
  }
  getAmount(): number {
    return this.amount;
  }
  getCurrency(): string {
    return this.currency;
  }
  getStatus(): TransactionStatus {
    return this.status;
  }
  getReference(): string | null {
    return this.reference;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getUpdatedAt(): Date {
    return this.updatedAt;
  }
}

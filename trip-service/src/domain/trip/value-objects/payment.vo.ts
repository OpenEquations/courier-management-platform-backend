import { PaymentStatus } from '../enums/payment-status.enum';

export interface PaymentSplit {
  riderId: string;
  portion: number;
}

export class Payment {
  private constructor(
    private readonly status: PaymentStatus,
    private readonly splits: PaymentSplit[],
    private readonly holdTransactionId: string | null,
  ) {}

  static initial(): Payment {
    return new Payment(PaymentStatus.INITIAL, [], null);
  }

  static reconstitute(status: PaymentStatus, splits: PaymentSplit[], holdTransactionId: string | null = null): Payment {
    return new Payment(status, splits, holdTransactionId);
  }

  hold(): Payment {
    return new Payment(PaymentStatus.HELD, this.splits, this.holdTransactionId);
  }

  release(): Payment {
    return new Payment(PaymentStatus.RELEASED, this.splits, this.holdTransactionId);
  }

  refund(): Payment {
    return new Payment(PaymentStatus.REFUNDED, this.splits, this.holdTransactionId);
  }

  withHoldTransaction(transactionId: string): Payment {
    return new Payment(this.status, this.splits, transactionId);
  }

  isHeld(): boolean {
    return this.status === PaymentStatus.HELD;
  }

  recordSplit(riderId: string, portionCompleted: number): Payment {
    return new Payment(this.status, [...this.splits, { riderId, portion: portionCompleted }], this.holdTransactionId);
  }

  getStatus(): PaymentStatus { return this.status; }
  getSplits(): PaymentSplit[] { return [...this.splits]; }
  getHoldTransactionId(): string | null { return this.holdTransactionId; }
}

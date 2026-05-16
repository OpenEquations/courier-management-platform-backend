import { PaymentStatus } from '../enums/payment-status.enum';

export interface PaymentSplit {
  riderId: string;
  portion: number;
}

export class Payment {
  private constructor(
    private readonly status: PaymentStatus,
    private readonly splits: PaymentSplit[],
  ) {}

  static initial(): Payment {
    return new Payment(PaymentStatus.INITIAL, []);
  }

  static reconstitute(status: PaymentStatus, splits: PaymentSplit[]): Payment {
    return new Payment(status, splits);
  }

  hold(): Payment {
    return new Payment(PaymentStatus.HELD, this.splits);
  }

  release(): Payment {
    return new Payment(PaymentStatus.RELEASED, this.splits);
  }

  refund(): Payment {
    return new Payment(PaymentStatus.REFUNDED, this.splits);
  }

  isHeld(): boolean {
    return this.status === PaymentStatus.HELD;
  }

  recordSplit(riderId: string, portionCompleted: number): Payment {
    return new Payment(this.status, [...this.splits, { riderId, portion: portionCompleted }]);
  }

  getStatus(): PaymentStatus { return this.status; }
  getSplits(): PaymentSplit[] { return [...this.splits]; }
}

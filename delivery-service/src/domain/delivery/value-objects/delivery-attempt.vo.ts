import { FailureReason } from '../enums/failure-reason.enum';

export class DeliveryAttempt {
  private constructor(
    private readonly riderId: string,
    private readonly attemptedAt: Date,
    private readonly successful: boolean,
    private readonly failureReason: FailureReason | null,
    private readonly notes: string | null,
  ) {}

  static success(riderId: string, attemptedAt: Date): DeliveryAttempt {
    return new DeliveryAttempt(riderId, attemptedAt, true, null, null);
  }

  static failed(
    riderId: string,
    attemptedAt: Date,
    reason: FailureReason,
    notes?: string,
  ): DeliveryAttempt {
    return new DeliveryAttempt(riderId, attemptedAt, false, reason, notes ?? null);
  }

  static reconstitute(props: {
    riderId: string;
    attemptedAt: Date;
    successful: boolean;
    failureReason: FailureReason | null;
    notes: string | null;
  }): DeliveryAttempt {
    return new DeliveryAttempt(
      props.riderId, props.attemptedAt, props.successful,
      props.failureReason, props.notes,
    );
  }

  getRiderId(): string { return this.riderId; }
  getAttemptedAt(): Date { return this.attemptedAt; }
  isSuccessful(): boolean { return this.successful; }
  getFailureReason(): FailureReason | null { return this.failureReason; }
  getNotes(): string | null { return this.notes; }
}

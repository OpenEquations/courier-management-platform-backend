import { CodStatus } from '../enums/cod-status.enum';

export class CodInfo {
  private constructor(
    private readonly amount: number,
    private readonly status: CodStatus,
    private readonly collectedAt: Date | null,
    private readonly remittedAt: Date | null,
  ) {}

  static pending(amount: number): CodInfo {
    if (amount <= 0) throw new Error('COD amount must be positive');
    return new CodInfo(amount, CodStatus.PENDING, null, null);
  }

  static reconstitute(
    amount: number,
    status: CodStatus,
    collectedAt: Date | null,
    remittedAt: Date | null,
  ): CodInfo {
    return new CodInfo(amount, status, collectedAt, remittedAt);
  }

  collect(): CodInfo {
    if (this.status !== CodStatus.PENDING) throw new Error('COD is not in PENDING state');
    return new CodInfo(this.amount, CodStatus.COLLECTED, new Date(), null);
  }

  remit(): CodInfo {
    if (this.status !== CodStatus.COLLECTED) throw new Error('COD must be COLLECTED before remitting');
    return new CodInfo(this.amount, CodStatus.REMITTED, this.collectedAt, new Date());
  }

  isPending(): boolean { return this.status === CodStatus.PENDING; }

  getAmount(): number { return this.amount; }
  getStatus(): CodStatus { return this.status; }
  getCollectedAt(): Date | null { return this.collectedAt; }
  getRemittedAt(): Date | null { return this.remittedAt; }
}

// domain/payment/value-objects/money.vo.ts

export class Money {
  private readonly amount: number;
  private readonly currency: string;

  constructor(amount: number, currency: string) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('Amount must be a positive, finite number');
    }
    if (!currency || !currency.trim().match(/^[A-Za-z]{3}$/)) {
      throw new Error('Currency must be a 3-letter ISO code');
    }
    this.amount = Math.round(amount * 100) / 100;
    this.currency = currency.toUpperCase().trim();
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}

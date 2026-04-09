export class NationalId {
  private readonly value: string;

  constructor(value: string) {
    if (!value) throw new Error('National ID cannot be empty');
    // national id should 16 digits
    if (!value.match(/^\d{16}$/)) {
      throw new Error('Invalid national ID format');
    }
    this.value = value.trim();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: NationalId): boolean {
    return this.value === other.value;
  }
}

// domain/value-objects/email.vo.ts
export class Email {
  private readonly value: string;

  constructor(value: string) {
    if (!value) throw new Error('Email cannot be empty');
    if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new Error('Invalid email format');
    }
    this.value = value.toLowerCase().trim();
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
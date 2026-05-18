export class Recipient {
  private constructor(
    private readonly name: string,
    private readonly phone: string,
    private readonly email: string | null,
  ) {}

  static create(name: string, phone: string, email?: string): Recipient {
    if (!name?.trim()) throw new Error('Recipient name is required');
    if (!phone?.trim()) throw new Error('Recipient phone is required');
    return new Recipient(name, phone, email ?? null);
  }

  getName(): string { return this.name; }
  getPhone(): string { return this.phone; }
  getEmail(): string | null { return this.email; }
}

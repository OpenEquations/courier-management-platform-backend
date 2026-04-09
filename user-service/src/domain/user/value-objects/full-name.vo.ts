// domain/value-objects/full-name.vo.ts
export class FullName {
  private readonly firstName: string;
  private readonly lastName: string;

  constructor(firstName: string, lastName: string) {
    if (!firstName || !lastName) {
      throw new Error('First name and last name are required');
    }
    if (firstName.length < 2 || lastName.length < 2) {
      throw new Error('Name must be at least 2 characters');
    }
    this.firstName = firstName.trim();
    this.lastName = lastName.trim();
  }

  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  getFirstName(): string {
    return this.firstName;
  }
  getLastName(): string {
    return this.lastName;
  }

  equals(other: FullName): boolean {
    return (
      this.firstName === other.firstName && this.lastName === other.lastName
    );
  }
}

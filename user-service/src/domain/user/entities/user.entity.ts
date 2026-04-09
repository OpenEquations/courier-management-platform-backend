import { Gender } from '../enums';
import { Email } from '../value-objects/email.vo';
import { NationalId } from '../value-objects/national-id.vo';

export class User {
  private constructor(
    private readonly id: string,
    private firstName: string,
    private lastName: string,
    private email: Email,
    private gender: Gender,
    private nationalId: NationalId,
    private password: string,
    private isActive: boolean,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  // Factory method — controls how a User is created
  static create(props: {
    id: string;
    firstName: string;
    lastName: string;
    email: Email;
    gender: Gender;
    nationalId: NationalId;
    password: string;
  }): User {
    return new User(
      props.id,
      props.firstName,
      props.lastName,
      props.email,
      props.gender,
      props.nationalId,
      props.password,
      true,
      new Date(),
      new Date(),
    );
  }

  // Behavior, not just getters/setters
  deactivate(): void {
    if (!this.isActive) {
      throw new Error('User is already deactivated');
    }
    this.isActive = false;
    this.updatedAt = new Date();
  }

  changeEmail(newEmail: Email): void {
    if (this.email.equals(newEmail)) {
      throw new Error('New email is the same as the current one');
    }
    this.email = newEmail;
    this.updatedAt = new Date();
  }

  changePassword(newPassword: string): void {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }
    this.password = newPassword;
    this.updatedAt = new Date();
  }

  changeName(newFirstName: string, newLastName: string): void {
    if (!newFirstName || !newLastName) {
      throw new Error('First name and last name are required');
    }
    this.firstName = newFirstName;
    this.lastName = newLastName;
    this.updatedAt = new Date();
  }

  // Identity-based equality
  equals(other: User): boolean {
    return this.id === other.id;
  }

  // Read access
  getId(): string {
    return this.id;
  }
  getFirstName(): string {
    return this.firstName;
  }
  getLastName(): string {
    return this.lastName;
  }
  getEmail(): Email {
    return this.email;
  }
  getGender(): Gender {
    return this.gender;
  }
  getNationalId(): NationalId {
    return this.nationalId;
  }
  getIsActive(): boolean {
    return this.isActive;
  }
}

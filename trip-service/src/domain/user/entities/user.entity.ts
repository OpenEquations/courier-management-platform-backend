// Lightweight read-model of a User in the trip-service bounded context.
// Only carries identity — cross-service data stays in user-service.
export class User {
  private constructor(private readonly id: string) {}

  static fromId(id: string): User {
    if (!id?.trim()) throw new Error('User id cannot be empty');
    return new User(id.trim());
  }

  getId(): string {
    return this.id;
  }
}

export class User {
  private constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly phone: string,
    private readonly email: string,
  ) {}

  static reconstitute(props: {
    id: string;
    name: string;
    phone: string;
    email: string;
  }): User {
    return new User(props.id, props.name, props.phone, props.email);
  }

  getId(): string { return this.id; }
  getName(): string { return this.name; }
  getPhone(): string { return this.phone; }
  getEmail(): string { return this.email; }
}

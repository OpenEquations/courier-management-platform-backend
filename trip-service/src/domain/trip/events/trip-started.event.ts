import { User } from 'src/domain/user/entities/user.entity';

export class TripStartedEvent {
  constructor(
    public readonly tripId: string,
    public readonly rider: User,
    public readonly agreedPrice: number,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

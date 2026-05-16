import { User } from 'src/domain/user/entities/user.entity';

export class TripDisputedEvent {
  constructor(
    public readonly tripId: string,
    public readonly flaggedBy: User,
    public readonly reason: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

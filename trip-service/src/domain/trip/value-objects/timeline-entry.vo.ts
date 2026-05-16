import { TripStatus } from '../enums/trip-status.enum';

export class TimelineEntry {
  private constructor(
    private readonly status: TripStatus,
    private readonly timestamp: Date,
  ) {}

  static create(status: TripStatus): TimelineEntry {
    return new TimelineEntry(status, new Date());
  }

  static reconstitute(status: TripStatus, timestamp: Date): TimelineEntry {
    return new TimelineEntry(status, timestamp);
  }

  getStatus(): TripStatus { return this.status; }
  getTimestamp(): Date { return this.timestamp; }
}

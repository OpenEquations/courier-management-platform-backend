import { DeliveryStatus } from '../enums/delivery-status.enum';

export class TimelineEntry {
  private constructor(
    private readonly status: DeliveryStatus,
    private readonly timestamp: Date,
  ) {}

  static create(status: DeliveryStatus): TimelineEntry {
    return new TimelineEntry(status, new Date());
  }

  static reconstitute(status: DeliveryStatus, timestamp: Date): TimelineEntry {
    return new TimelineEntry(status, timestamp);
  }

  getStatus(): DeliveryStatus { return this.status; }
  getTimestamp(): Date { return this.timestamp; }
}

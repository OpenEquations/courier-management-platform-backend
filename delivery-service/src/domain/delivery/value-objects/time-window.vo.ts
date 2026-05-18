export class TimeWindow {
  private constructor(
    private readonly from: Date,
    private readonly to: Date,
  ) {}

  static create(from: Date, to: Date): TimeWindow {
    if (from >= to) throw new Error('Time window start must be before end');
    return new TimeWindow(from, to);
  }

  getFrom(): Date { return this.from; }
  getTo(): Date { return this.to; }

  contains(date: Date): boolean {
    return date >= this.from && date <= this.to;
  }
}

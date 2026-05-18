export class Location {
  private constructor(
    private readonly lat: number,
    private readonly lng: number,
    private readonly address: string,
  ) {}

  static create(lat: number, lng: number, address: string): Location {
    return new Location(lat, lng, address);
  }

  getLat(): number { return this.lat; }
  getLng(): number { return this.lng; }
  getAddress(): string { return this.address; }
}

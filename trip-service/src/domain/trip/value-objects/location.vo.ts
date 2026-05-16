export class Location {
  private constructor(
    private readonly lat: number,
    private readonly lng: number,
    private readonly address: string,
  ) {}

  static create(lat: number, lng: number, address: string): Location {
    if (lat < -90 || lat > 90) throw new Error('Invalid latitude');
    if (lng < -180 || lng > 180) throw new Error('Invalid longitude');
    if (!address?.trim()) throw new Error('Address cannot be empty');
    return new Location(lat, lng, address.trim());
  }

  getLat(): number { return this.lat; }
  getLng(): number { return this.lng; }
  getAddress(): string { return this.address; }

  equals(other: Location): boolean {
    return this.lat === other.lat && this.lng === other.lng;
  }
}

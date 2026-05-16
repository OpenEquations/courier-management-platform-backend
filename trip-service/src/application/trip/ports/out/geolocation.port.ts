import { Location } from 'src/domain/trip/value-objects/location.vo';

export interface IGeolocationPort {
  calculateDistance(from: Location, to: Location): Promise<number>;
  getAddress(lat: number, lng: number): Promise<string>;
}

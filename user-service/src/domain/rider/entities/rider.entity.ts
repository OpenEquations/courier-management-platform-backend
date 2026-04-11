import { User } from 'src/domain/user/entities/user.entity';
import { Vehicle } from '../value-objects/vehicle.vo';

export class Rider {
  private readonly id: string;
  private readonly user: User;
  private readonly vehicle: Vehicle;

  constructor(id: string, user: User, vehicle: Vehicle) {
    this.id = id;
    this.user = user;
    this.vehicle = vehicle;
  }

  static create(props: { id: string; user: User; vehicle: Vehicle }): Rider {
    return new Rider(props.id, props.user, props.vehicle);
  }

  getId(): string {
    return this.id;
  }

  getUser(): User {
    return this.user;
  }

  getVehicle(): Vehicle {
    return this.vehicle;
  }
}

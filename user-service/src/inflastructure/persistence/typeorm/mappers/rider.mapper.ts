// infrastructure/persistence/typeorm/mappers/rider.mapper.ts

import { Rider } from "src/domain/rider/entities/rider.entity";
import { Vehicle } from "src/domain/rider/value-objects/vehicle.vo";
import { VehicleType } from "src/domain/rider/enums/vehicle-type.enum";
import { RiderOrmEntity } from "../entities/rider.orm-entity";
import { UserMapper } from "./user.mapper";

export class RiderMapper {
  static toDomain(orm: RiderOrmEntity): Rider {
    const user = UserMapper.toDomain(orm.user);
    const vehicles = orm.vehicles.map(
      (v) => new Vehicle(v.type as VehicleType, v.licensePlate),
    );
    return Rider.reconstitute({
      id: orm.id,
      user,
      vehicles,
      isAvailable: orm.isAvailable,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: Rider): RiderOrmEntity {
    const orm = new RiderOrmEntity();
    orm.id = domain.getId();
    orm.userId = domain.getUser().getId();
    orm.vehicles = domain.getVehicles().map((v) => ({
      type: v.getType(),
      licensePlate: v.getLicensePlate(),
    }));
    orm.isAvailable = domain.getIsAvailable();
    return orm;
  }
}

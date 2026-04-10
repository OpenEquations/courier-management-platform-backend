// infrastructure/persistence/typeorm/mappers/user.mapper.ts

import { User } from "src/domain/user/entities/user.entity";
import { Email } from "src/domain/user/value-objects/email.vo";
import { NationalId } from "src/domain/user/value-objects/national-id.vo";
import { UserOrmEntity } from "../entities/user.orm-entity";

export class UserMapper {
  static toDomain(orm: UserOrmEntity): User {
    return User.reconstitute({
      id: orm.id,
      firstName: orm.firstName,
      lastName: orm.lastName,
      email: new Email(orm.email),
      gender: orm.gender,
      nationalId: new NationalId(orm.nationalId),
      password: orm.password,
      isActive: orm.isActive,
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    });
  }

  static toOrm(domain: User): UserOrmEntity {
    const orm = new UserOrmEntity();
    orm.id = domain.getId();
    orm.firstName = domain.getFirstName();
    orm.lastName = domain.getLastName();
    orm.email = domain.getEmail().getValue();
    orm.gender = domain.getGender();
    orm.nationalId = domain.getNationalId().getValue();
    orm.password = domain.getPassword();
    orm.isActive = domain.getIsActive();
    return orm;
  }
}
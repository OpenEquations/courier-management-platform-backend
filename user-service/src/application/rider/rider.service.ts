import { Injectable,Inject } from "@nestjs/common";
import type { IRiderRepository } from "src/domain/rider/interfaces/repositories/rider.repository.interface";
import type { IUserRepository } from "src/domain/user/interfaces/repositories/user.repository.interface";
import { generateId } from "../shared/utils/id-generator";
import { Rider } from "src/domain/rider/entities/rider.entity";
import { Vehicle } from "src/domain/rider/value-objects/vehicle.vo";
import { VehicleType } from "src/domain/rider/enums/vehicle-type.enum";
import { RiderResponseDto } from "./dto/rider-response.dto";

@Injectable()
export class RiderService {
  constructor(
    @Inject("IRiderRepository") private readonly riderRepository: IRiderRepository,
    @Inject("IUserRepository") private readonly userRepository: IUserRepository,
  ) {}

      async createRider(vehicleType: VehicleType, userId: string, vehiclePlate: string): Promise<RiderResponseDto> {
        
        const user = await this.userRepository.findById(userId);
        if (!user) throw new Error("User not found");
        if (!user.getIsActive()) throw new Error("User account is deactivated");
        const existingRider = await this.riderRepository.findByVehiclePlate(vehiclePlate);
        if (existingRider) throw new Error("Rider with this vehicle plate already exists");
        const rider = Rider.create({
          id: generateId(),
          user,
          vehicle: new Vehicle(vehicleType, vehiclePlate),
        });
        await this.riderRepository.save(rider);
        return RiderResponseDto.fromEntity(rider);
      }
  }
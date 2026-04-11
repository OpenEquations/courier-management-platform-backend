// application/rider/rider.service.ts

import { Injectable, Inject } from "@nestjs/common";
import type { IRiderRepository } from "src/domain/rider/interfaces/repositories/rider.repository.interface";
import type { IUserRepository } from "src/domain/user/interfaces/repositories/user.repository.interface";
import { generateId } from "../shared/utils/id-generator";
import { Rider } from "src/domain/rider/entities/rider.entity";
import { Vehicle } from "src/domain/rider/value-objects/vehicle.vo";
import { CreateRiderDto } from "./dto/create-rider.dto";
import { AddVehicleDto } from "./dto/add-vehicle.dto";
import { RiderResponseDto } from "./dto/rider-response.dto";
import { NotFoundException } from "src/domain/shared/exceptions/not-found.exception";
import { ConflictException } from "src/domain/shared/exceptions/conflict.exception";
import { ForbiddenException } from "src/domain/shared/exceptions/forbidden.exception";

@Injectable()
export class RiderService {
  constructor(
    @Inject("IRiderRepository") private readonly riderRepository: IRiderRepository,
    @Inject("IUserRepository") private readonly userRepository: IUserRepository,
  ) {}

  async createRider(dto: CreateRiderDto): Promise<RiderResponseDto> {
    const user = await this.userRepository.findById(dto.userId);
    if (!user) throw new NotFoundException("User not found");
    if (!user.getIsActive()) throw new ForbiddenException("User account is deactivated");

    const existingRider = await this.riderRepository.findByUserId(dto.userId);
    if (existingRider) throw new ConflictException("User is already a rider");

    const vehicle = new Vehicle(dto.vehicleType, dto.vehiclePlate);

    const rider = Rider.create({
      id: generateId(),
      user,
      vehicle,
    });

    await this.riderRepository.save(rider);
    return RiderResponseDto.fromEntity(rider);
  }

  async addVehicle(riderId: string, dto: AddVehicleDto): Promise<RiderResponseDto> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) throw new NotFoundException("Rider not found");

    const vehicle = new Vehicle(dto.vehicleType, dto.vehiclePlate);
    rider.addVehicle(vehicle);

    await this.riderRepository.update(rider);
    return RiderResponseDto.fromEntity(rider);
  }

  async removeVehicle(riderId: string, licensePlate: string): Promise<RiderResponseDto> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) throw new NotFoundException("Rider not found");

    rider.removeVehicle(licensePlate);

    await this.riderRepository.update(rider);
    return RiderResponseDto.fromEntity(rider);
  }

  async getRiderById(riderId: string): Promise<RiderResponseDto> {
    const rider = await this.riderRepository.findById(riderId);
    if (!rider) throw new NotFoundException("Rider not found");
    return RiderResponseDto.fromEntity(rider);
  }

  async getRiderByUserId(userId: string): Promise<RiderResponseDto> {
    const rider = await this.riderRepository.findByUserId(userId);
    if (!rider) throw new NotFoundException("Rider not found");
    return RiderResponseDto.fromEntity(rider);
  }
}

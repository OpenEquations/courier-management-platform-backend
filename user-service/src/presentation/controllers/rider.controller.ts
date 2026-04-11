// presentation/controllers/rider.controller.ts

import { Controller, Get, Post, Delete, Body, Param } from "@nestjs/common";
import { RiderService } from "src/application/rider/rider.service";
import { CreateRiderDto } from "src/application/rider/dto/create-rider.dto";
import { AddVehicleDto } from "src/application/rider/dto/add-vehicle.dto";

@Controller("riders")
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  @Post()
  async createRider(@Body() dto: CreateRiderDto) {
    return this.riderService.createRider(dto);
  }

  @Get(":id")
  async getRiderById(@Param("id") id: string) {
    return this.riderService.getRiderById(id);
  }

  @Get("user/:userId")
  async getRiderByUserId(@Param("userId") userId: string) {
    return this.riderService.getRiderByUserId(userId);
  }

  @Post(":id/vehicles")
  async addVehicle(@Param("id") id: string, @Body() dto: AddVehicleDto) {
    return this.riderService.addVehicle(id, dto);
  }

  @Delete(":id/vehicles/:plate")
  async removeVehicle(@Param("id") id: string, @Param("plate") plate: string) {
    return this.riderService.removeVehicle(id, plate);
  }
}

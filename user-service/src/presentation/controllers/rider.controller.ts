// presentation/controllers/rider.controller.ts

import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { RiderService } from "src/application/rider/rider.service";
import { CreateRiderDto } from "src/application/rider/dto/create-rider.dto";
import { AddVehicleDto } from "src/application/rider/dto/add-vehicle.dto";
import { JwtGuard } from "src/inflastructure/security/jwt.guard";
import { CurrentUser } from "src/presentation/decorators/current-user.decorator";

@Controller("riders")
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  @Post()
  @UseGuards(JwtGuard)
  async createRider(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateRiderDto,
  ) {
    return this.riderService.createRider(user.userId, dto);
  }

  // Must be declared before :id route so NestJS doesn't swallow "batch" as a param
  @Get("batch")
  async getRidersByIds(@Query("ids") ids: string) {
    const idList = ids ? ids.split(",").map(s => s.trim()).filter(Boolean) : [];
    return this.riderService.getRidersByIds(idList);
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

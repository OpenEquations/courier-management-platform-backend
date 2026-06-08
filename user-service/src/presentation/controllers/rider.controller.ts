// presentation/controllers/rider.controller.ts

import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { RiderService } from "src/application/rider/rider.service";
import { CreateRiderDto } from "src/application/rider/dto/create-rider.dto";
import { AddVehicleDto } from "src/application/rider/dto/add-vehicle.dto";
import { RiderResponseDto } from "src/application/rider/dto/rider-response.dto";
import { JwtGuard } from "src/inflastructure/security/jwt.guard";
import { CurrentUser } from "src/presentation/decorators/current-user.decorator";

@ApiTags("riders")
@Controller("riders")
export class RiderController {
  constructor(private readonly riderService: RiderService) {}

  @Post()
  @UseGuards(JwtGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Register the authenticated user as a rider (courier)",
    description:
      "Upgrades an existing user account into a rider profile with one starter vehicle. " +
      "Call `POST /riders/:id/vehicles` afterwards to add more vehicles.",
  })
  @ApiResponse({ status: 201, description: "Rider profile created.", type: RiderResponseDto })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token." })
  @ApiResponse({ status: 409, description: "This user is already a rider." })
  async createRider(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateRiderDto,
  ) {
    return this.riderService.createRider(user.userId, dto);
  }

  // Must be declared before :id route so NestJS doesn't swallow "batch" as a param
  @Get("batch")
  @ApiOperation({
    summary: "Look up several riders by ID at once",
    description:
      "Used internally by matching-service to enrich nearby-rider candidates with " +
      "availability and vehicle info in a single round trip.",
  })
  @ApiQuery({ name: "ids", required: true, description: "Comma-separated rider UUIDs", example: "id-1,id-2,id-3" })
  @ApiResponse({ status: 200, description: "Riders found (unmatched IDs are silently skipped).", type: [RiderResponseDto] })
  async getRidersByIds(@Query("ids") ids: string) {
    const idList = ids ? ids.split(",").map(s => s.trim()).filter(Boolean) : [];
    return this.riderService.getRidersByIds(idList);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a rider profile by rider ID" })
  @ApiParam({ name: "id", description: "Rider UUID" })
  @ApiResponse({ status: 200, description: "The rider.", type: RiderResponseDto })
  @ApiResponse({ status: 404, description: "No rider with this ID." })
  async getRiderById(@Param("id") id: string) {
    return this.riderService.getRiderById(id);
  }

  @Get("user/:userId")
  @ApiOperation({ summary: "Get a rider profile by the underlying user ID" })
  @ApiParam({ name: "userId", description: "User UUID (from user-service)" })
  @ApiResponse({ status: 200, description: "The rider.", type: RiderResponseDto })
  @ApiResponse({ status: 404, description: "This user has no rider profile." })
  async getRiderByUserId(@Param("userId") userId: string) {
    return this.riderService.getRiderByUserId(userId);
  }

  @Post(":id/vehicles")
  @ApiOperation({ summary: "Add a vehicle to a rider's fleet" })
  @ApiParam({ name: "id", description: "Rider UUID" })
  @ApiResponse({ status: 201, description: "Vehicle added.", type: RiderResponseDto })
  @ApiResponse({ status: 409, description: "This plate is already registered to the rider." })
  async addVehicle(@Param("id") id: string, @Body() dto: AddVehicleDto) {
    return this.riderService.addVehicle(id, dto);
  }

  @Delete(":id/vehicles/:plate")
  @ApiOperation({ summary: "Remove a vehicle from a rider's fleet" })
  @ApiParam({ name: "id", description: "Rider UUID" })
  @ApiParam({ name: "plate", description: "License plate to remove", example: "RAB-123-A" })
  @ApiResponse({ status: 200, description: "Vehicle removed.", type: RiderResponseDto })
  @ApiResponse({ status: 404, description: "No vehicle with this plate on this rider." })
  async removeVehicle(@Param("id") id: string, @Param("plate") plate: string) {
    return this.riderService.removeVehicle(id, plate);
  }
}

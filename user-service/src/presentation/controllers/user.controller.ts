// presentation/controllers/user.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { CreateUserDto } from "src/application/user/dto/create-user.dot";
import { ChangeNameDto } from "src/application/user/dto/change-name.dto";
import { ChangeEmailDto } from "src/application/user/dto/change-email.dto";
import { ChangePasswordDto } from "src/application/user/dto/change-password.dto";
import { LoginDto } from "src/application/user/dto/login.dto";
import { UserService } from "src/application/user/user.service";
import { JwtGuard } from "src/inflastructure/security/jwt.guard";
import { CurrentUser } from "src/presentation/decorators/current-user.decorator";


@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Get("me")
  @UseGuards(JwtGuard)
  async getMe(@CurrentUser() user: { userId: string }) {
    return this.userService.getUserById(user.userId);
  }

  @Get(":id")
  async getUserById(@Param("id") id: string) {
    return this.userService.getUserById(id);
  }

  @Get()
  async getUsers(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.userService.getUsers(page, limit);
  }

  @Put(":id/name")
  async changeName(@Param("id") id: string, @Body() dto: ChangeNameDto) {
    return this.userService.changeName(id, dto.firstName, dto.lastName);
  }

  @Put(":id/email")
  async changeEmail(@Param("id") id: string, @Body() dto: ChangeEmailDto) {
    return this.userService.changeEmail(id, dto.email);
  }

  @Put(":id/password")
  async changePassword(@Param("id") id: string, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(id, dto.currentPassword, dto.newPassword);
  }

  @Post("login")
  async login(@Body() dto: LoginDto) {
    return this.userService.login(dto.email, dto.password);
  }

  @Put(":id/deactivate")
  async deactivateUser(@Param("id") id: string) {
    return this.userService.deactivateUser(id);
  }

  @Delete(":id")
  async deleteUser(@Param("id") id: string) {
    return this.userService.deleteUser(id);
  }
}
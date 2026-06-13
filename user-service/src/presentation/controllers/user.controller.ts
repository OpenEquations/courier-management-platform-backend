// presentation/controllers/user.controller.ts

import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CreateUserDto } from "src/application/user/dto/create-user.dot";
import { ChangeNameDto } from "src/application/user/dto/change-name.dto";
import { ChangeEmailDto } from "src/application/user/dto/change-email.dto";
import { ChangePhoneDto } from "src/application/user/dto/change-phone.dto";
import { ChangePasswordDto } from "src/application/user/dto/change-password.dto";
import { LoginDto } from "src/application/user/dto/login.dto";
import { UserResponseDto } from "src/application/user/dto/user-response.dto";
import { UserService } from "src/application/user/user.service";
import { JwtGuard } from "src/inflastructure/security/jwt.guard";
import { CurrentUser } from "src/presentation/decorators/current-user.decorator";


@ApiTags("users")
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({
    summary: "Register a new account",
    description:
      "Creates a passenger account. This is the first call any new consumer makes — " +
      "follow up with `POST /users/login` to obtain a JWT.",
  })
  @ApiResponse({ status: 201, description: "Account created.", type: UserResponseDto })
  @ApiResponse({ status: 409, description: "Email or national ID already in use." })
  async createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @Post("login")
  @ApiOperation({
    summary: "Log in and obtain a JWT",
    description:
      "Exchanges email + password for a short-lived `accessToken`. " +
      "Send it on subsequent requests as `Authorization: Bearer <accessToken>`.",
  })
  @ApiResponse({ status: 200, description: "Returns `{ accessToken, user }`." })
  @ApiResponse({ status: 401, description: "Invalid email or password." })
  async login(@Body() dto: LoginDto) {
    return this.userService.login(dto.email, dto.password);
  }

  @Get("me")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({
    summary: "Get the authenticated user's own profile",
    description: "Resolves the caller from the JWT — use this instead of `GET /users/:id` when you mean \"me\".",
  })
  @ApiResponse({ status: 200, description: "The caller's profile.", type: UserResponseDto })
  @ApiResponse({ status: 401, description: "Missing or invalid bearer token." })
  async getMe(@CurrentUser() user: { userId: string }) {
    return this.userService.getUserById(user.userId);
  }

  @Get(":id")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Get a user by ID" })
  @ApiParam({ name: "id", description: "User UUID", example: "3fa2c1d4-5b6e-4f7a-8c9d-0e1f2a3b4c5d" })
  @ApiResponse({ status: 200, description: "The user.", type: UserResponseDto })
  @ApiResponse({ status: 404, description: "No user with this ID." })
  async getUserById(@Param("id") id: string) {
    return this.userService.getUserById(id);
  }

  @Get()
  @ApiOperation({ summary: "List users (paginated)" })
  @ApiQuery({ name: "page", required: false, example: 1, description: "1-based page number" })
  @ApiQuery({ name: "limit", required: false, example: 10, description: "Results per page" })
  @ApiResponse({ status: 200, description: "Paginated list of users." })
  async getUsers(
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
  ) {
    return this.userService.getUsers(page, limit);
  }

  @Put(":id/name")
  @ApiOperation({ summary: "Change a user's first/last name" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "Updated profile.", type: UserResponseDto })
  async changeName(@Param("id") id: string, @Body() dto: ChangeNameDto) {
    return this.userService.changeName(id, dto.firstName, dto.lastName);
  }

  @Put(":id/email")
  @ApiOperation({ summary: "Change a user's email address" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "Updated profile.", type: UserResponseDto })
  @ApiResponse({ status: 409, description: "Email already in use." })
  async changeEmail(@Param("id") id: string, @Body() dto: ChangeEmailDto) {
    return this.userService.changeEmail(id, dto.email);
  }

  @Put(":id/phone")
  @UseGuards(JwtGuard)
  @ApiBearerAuth("access-token")
  @ApiOperation({ summary: "Change a user's contact phone number" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "Updated profile.", type: UserResponseDto })
  async changePhone(@Param("id") id: string, @Body() dto: ChangePhoneDto) {
    return this.userService.changePhone(id, dto.phone);
  }

  @Put(":id/password")
  @ApiOperation({
    summary: "Change a user's password",
    description: "Requires the current password — used for self-service password changes (not a reset flow).",
  })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "Password changed." })
  @ApiResponse({ status: 401, description: "`currentPassword` is wrong." })
  async changePassword(@Param("id") id: string, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(id, dto.currentPassword, dto.newPassword);
  }

  @Put(":id/deactivate")
  @ApiOperation({ summary: "Deactivate a user account", description: "Soft-disables the account; it is not deleted." })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "Account deactivated.", type: UserResponseDto })
  async deactivateUser(@Param("id") id: string) {
    return this.userService.deactivateUser(id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Permanently delete a user account" })
  @ApiParam({ name: "id", description: "User UUID" })
  @ApiResponse({ status: 200, description: "Account deleted." })
  @ApiResponse({ status: 404, description: "No user with this ID." })
  async deleteUser(@Param("id") id: string) {
    return this.userService.deleteUser(id);
  }
}
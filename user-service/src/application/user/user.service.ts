import { User } from "src/domain/user/entities/user.entity";
import { IUserRepository } from "src/domain/user/interfaces/repositories/user.repository.interface";
import { IAuthService } from "src/domain/user/interfaces/services/auth.service.interface";
import { IHashService } from "src/domain/user/interfaces/services/hash.service.interface";
import { CreateUserDto } from "./dto/create-user.dot";
import { UserResponseDto } from "./dto/user-response.dto";
import { Email } from "src/domain/user/value-objects/email.vo";
import { NationalId } from "src/domain/user/value-objects/national-id.vo";
import { PaginatedResult } from "src/domain/shared/interfaces/paginated-result.interface";
import { generateId } from "src/application/shared/utils/id-generator";

export class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly authService: IAuthService,
    private readonly hashService: IHashService,
  ) {}

  async createUser(dto: CreateUserDto): Promise<UserResponseDto> {
    const email = new Email(dto.email);
    const nationalId = new NationalId(dto.nationalId);

    const emailExists = await this.userRepository.existsByEmail(email);
    if (emailExists) throw new Error("Email already taken");

    const hashedPassword = await this.hashService.hash(dto.password);

    const user = User.create({
      id: generateId(),
      firstName: dto.firstName,
      lastName: dto.lastName,
      email,
      gender: dto.gender,
      nationalId,
      password: hashedPassword,
    });

    await this.userRepository.save(user);
    return UserResponseDto.fromEntity(user);
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error("User not found");
    return UserResponseDto.fromEntity(user);
  }

  async getUsers(page: number, limit: number): Promise<PaginatedResult<UserResponseDto>> {
    const result = await this.userRepository.findAll(page, limit);
    return {
      ...result,
      data: result.data.map(UserResponseDto.fromEntity),
    };
  }

  async changeName(id: string, firstName: string, lastName: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error("User not found");

    user.changeName(firstName, lastName);
    await this.userRepository.update(user);
    return UserResponseDto.fromEntity(user);
  }

  async changeEmail(id: string, newEmail: string): Promise<UserResponseDto> {
    const email = new Email(newEmail);

    const emailExists = await this.userRepository.existsByEmail(email);
    if (emailExists) throw new Error("Email already taken");

    const user = await this.userRepository.findById(id);
    if (!user) throw new Error("User not found");

    user.changeEmail(email);
    await this.userRepository.update(user);
    return UserResponseDto.fromEntity(user);
  }

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error("User not found");

    const currentPasswordHash = user.getPassword();
    const isMatch = await this.hashService.compare(oldPassword, currentPasswordHash);
    if (!isMatch) throw new Error("Current password is incorrect");

    const hashedPassword = await this.hashService.hash(newPassword);
    user.changePassword(hashedPassword);
    await this.userRepository.update(user);
  }

  async deactivateUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error("User not found");

    user.deactivate();
    await this.userRepository.update(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error("User not found");

    await this.userRepository.delete(id);
  }
}

import { User } from "src/domain/user/entities/user.entity";
import { IUserRepository } from "src/domain/user/interfaces/repositories/user.repository.interface";
import { IAuthService } from "src/domain/user/interfaces/services/auth.service.interface";
import { IHashService } from "src/domain/user/interfaces/services/hash.service.interface";
import { CreateUserDto } from "./dto/create-user.dot";
import { UserResponseDto } from "./dto/user-response.dto";
import { Email } from "src/domain/user/value-objects/email.vo";
import { NationalId } from "src/domain/user/value-objects/national-id.vo";
import { generateId } from "../shared/utils/id-generator";

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
}
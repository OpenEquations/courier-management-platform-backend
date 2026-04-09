// application/user/dto/create-user.dto.ts

import {
  IsString,
  IsEmail,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Gender } from 'src/domain/user/enums';

export class CreateUserDto {
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsEnum(Gender)
  gender!: Gender;

  @IsString()
  @MinLength(16)
  @MaxLength(16)
  nationalId!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

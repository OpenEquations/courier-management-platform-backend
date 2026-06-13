// application/user/dto/create-user.dto.ts

import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from 'src/domain/user/enums';

export class CreateUserDto {
  @ApiProperty({ example: 'Joe', minLength: 2, maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: 'Lebonheur', minLength: 2, maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({ example: 'joe.lebonheur@example.com', description: 'Must be unique across all accounts' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: Gender, example: Gender.MALE })
  @IsEnum(Gender)
  gender!: Gender;

  @ApiProperty({ example: '1199880012345678', minLength: 16, maxLength: 16, description: 'Exactly 16 characters, must be unique' })
  @IsString()
  @MinLength(16)
  @MaxLength(16)
  nationalId!: string;

  @ApiProperty({ example: 'S3curePass!', minLength: 8, description: 'At least 8 characters; stored hashed (bcrypt)' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: '+250788123456', required: false, description: 'Contact phone number, shared with the other party once a trip is accepted' })
  @IsOptional()
  @IsString()
  phone?: string | null;
}

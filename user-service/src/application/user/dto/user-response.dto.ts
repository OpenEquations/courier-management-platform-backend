import { ApiProperty } from '@nestjs/swagger';
import { Gender } from 'src/domain/user/enums';
import { User } from 'src/domain/user/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ example: '3fa2c1d4-5b6e-4f7a-8c9d-0e1f2a3b4c5d' })
  readonly id: string;
  @ApiProperty({ example: 'Joe' })
  readonly firstName: string;
  @ApiProperty({ example: 'Lebonheur' })
  readonly lastName: string;
  @ApiProperty({ example: 'joe.lebonheur@example.com' })
  readonly email: string;
  @ApiProperty({ enum: Gender, example: Gender.MALE })
  readonly gender: Gender;
  @ApiProperty({ example: true })
  readonly isActive: boolean;

  private constructor(props: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    gender: Gender;
    isActive: boolean;
  }) {
    this.id = props.id;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.email = props.email;
    this.gender = props.gender;
    this.isActive = props.isActive;
  }

  static fromEntity(user: User): UserResponseDto {
    return new UserResponseDto({
      id: user.getId(),
      firstName: user.getFirstName(),
      lastName: user.getLastName(),
      email: user.getEmail().getValue(),
      gender: user.getGender(),
      isActive: user.getIsActive(),
    });
  }
}

import { Gender } from 'src/domain/user/enums';
import { User } from 'src/domain/user/entities/user.entity';

export class UserResponseDto {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly gender: Gender;
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

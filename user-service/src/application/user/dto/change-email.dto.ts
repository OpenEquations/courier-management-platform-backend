import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangeEmailDto {
  @ApiProperty({ example: 'new.email@example.com', description: 'Must be unique across all accounts' })
  @IsEmail()
  email!: string;
}

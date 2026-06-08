import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass123!', description: 'The account\'s current password, for verification' })
  @IsString()
  currentPassword!: string;

  @ApiProperty({ example: 'NewPass456!', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword!: string;
}

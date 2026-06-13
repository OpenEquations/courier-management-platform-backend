import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePhoneDto {
  @ApiProperty({ example: '+250788123456', nullable: true })
  @IsOptional()
  @IsString()
  phone!: string | null;
}

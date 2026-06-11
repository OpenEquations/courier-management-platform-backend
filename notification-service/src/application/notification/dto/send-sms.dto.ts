import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({ example: '+1234567890', description: 'E.164 formatted phone number' })
  @IsString()
  @MinLength(1)
  to: string;

  @ApiProperty({ example: 'Your package has been picked up by the rider.' })
  @IsString()
  @MinLength(1)
  body: string;
}

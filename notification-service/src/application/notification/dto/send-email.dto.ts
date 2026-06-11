import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  to: string;

  @ApiProperty({ example: 'Your trip has been completed' })
  @IsString()
  @MinLength(1)
  subject: string;

  @ApiProperty({ example: 'Your trip #abc123 has been completed. Thank you!' })
  @IsString()
  @MinLength(1)
  text: string;

  @ApiPropertyOptional({ example: '<p>Your trip <strong>#abc123</strong> has been completed.</p>' })
  @IsString()
  @IsOptional()
  html?: string;
}

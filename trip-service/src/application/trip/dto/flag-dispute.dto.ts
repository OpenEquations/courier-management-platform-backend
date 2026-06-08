import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FlagDisputeDto {
  @ApiProperty({ example: '3fa2c1d4-5b6e-4f7a-8c9d-0e1f2a3b4c5d', description: 'UUID of the user (passenger or rider) raising the dispute' })
  @IsString() @IsNotEmpty() flaggedById!: string;
  @ApiProperty({ example: 'Charged amount does not match the agreed price' })
  @IsString() @IsNotEmpty() reason!: string;
}

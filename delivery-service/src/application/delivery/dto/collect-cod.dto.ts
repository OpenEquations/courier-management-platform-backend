import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CollectCodDto {
  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d', description: 'UUID of the rider/courier who collected the cash from the recipient' })
  @IsUUID()
  riderId!: string;
}

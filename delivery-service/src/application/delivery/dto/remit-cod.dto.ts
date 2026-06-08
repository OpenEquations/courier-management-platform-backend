import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class RemitCodDto {
  @ApiPropertyOptional({ example: 'REMIT-2026-00042', description: 'Optional reference number for the cash hand-over/settlement record' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;
}

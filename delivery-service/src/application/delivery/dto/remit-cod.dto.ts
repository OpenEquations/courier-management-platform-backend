import { IsOptional, IsString } from 'class-validator';

export class RemitCodDto {
  @IsOptional()
  @IsString()
  referenceNumber?: string;
}

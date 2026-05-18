import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProofType } from 'src/domain/delivery/enums/proof-type.enum';

export class RecordPickupDto {
  @IsEnum(ProofType)
  proofType!: ProofType;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsUUID()
  capturedByRiderId!: string;
}

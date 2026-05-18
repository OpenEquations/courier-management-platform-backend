import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ProofType } from 'src/domain/delivery/enums/proof-type.enum';

export class RecordDeliveryDto {
  @IsEnum(ProofType)
  proofType!: ProofType;

  @IsOptional()
  @IsString()
  fileUrl?: string;

  @IsUUID()
  capturedByRiderId!: string;

  @IsString()
  @IsNotEmpty()
  deliveredTo!: string;
}

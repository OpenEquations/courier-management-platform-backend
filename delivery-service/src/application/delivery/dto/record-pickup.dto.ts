import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProofType } from 'src/domain/delivery/enums/proof-type.enum';

export class RecordPickupDto {
  @ApiProperty({ enum: ProofType, example: ProofType.PHOTO, description: 'How pickup was verified' })
  @IsEnum(ProofType)
  proofType!: ProofType;

  @ApiPropertyOptional({ example: 'https://storage.example.com/proofs/pickup-8821.jpg', description: 'URL to the captured signature/photo, required for SIGNATURE/PHOTO proof types' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d', description: 'UUID of the rider/courier who picked up the package' })
  @IsUUID()
  capturedByRiderId!: string;
}

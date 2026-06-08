import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProofType } from 'src/domain/delivery/enums/proof-type.enum';

export class RecordDeliveryDto {
  @ApiProperty({ enum: ProofType, example: ProofType.SIGNATURE, description: 'How delivery was verified' })
  @IsEnum(ProofType)
  proofType!: ProofType;

  @ApiPropertyOptional({ example: 'https://storage.example.com/proofs/delivery-8821.jpg', description: 'URL to the captured signature/photo, required for SIGNATURE/PHOTO proof types' })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d', description: 'UUID of the rider/courier who completed the delivery' })
  @IsUUID()
  capturedByRiderId!: string;

  @ApiProperty({ example: 'Eric Niyonsenga (recipient)', description: 'Name of the person who actually received the package' })
  @IsString()
  @IsNotEmpty()
  deliveredTo!: string;
}

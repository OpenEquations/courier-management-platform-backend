import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FailureReason } from 'src/domain/delivery/enums/failure-reason.enum';

export class RecordFailedAttemptDto {
  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d', description: 'UUID of the rider/courier who attempted the delivery' })
  @IsUUID()
  riderId!: string;

  @ApiProperty({ enum: FailureReason, example: FailureReason.RECIPIENT_NOT_HOME, description: 'Why the delivery attempt failed' })
  @IsEnum(FailureReason)
  reason!: FailureReason;

  @ApiPropertyOptional({ example: 'Called twice, no answer. Will retry tomorrow morning.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

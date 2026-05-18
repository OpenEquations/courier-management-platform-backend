import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { FailureReason } from 'src/domain/delivery/enums/failure-reason.enum';

export class RecordFailedAttemptDto {
  @IsUUID()
  riderId!: string;

  @IsEnum(FailureReason)
  reason!: FailureReason;

  @IsOptional()
  @IsString()
  notes?: string;
}

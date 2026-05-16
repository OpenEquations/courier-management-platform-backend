import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { CancelledBy } from 'src/domain/trip/enums';

export class CancelTripDto {
  @IsEnum(CancelledBy) cancelledBy!: CancelledBy;
  @IsString() @IsNotEmpty() reason!: string;
}

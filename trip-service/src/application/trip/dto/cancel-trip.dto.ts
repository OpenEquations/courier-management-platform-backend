import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CancelledBy } from 'src/domain/trip/enums';

export class CancelTripDto {
  @ApiProperty({ enum: CancelledBy, example: CancelledBy.CUSTOMER })
  @IsEnum(CancelledBy) cancelledBy!: CancelledBy;
  @ApiProperty({ example: 'Passenger no longer needs the ride' })
  @IsString() @IsNotEmpty() reason!: string;
}

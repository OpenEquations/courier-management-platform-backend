import { IsString, IsNotEmpty } from 'class-validator';

export class FlagDisputeDto {
  @IsString() @IsNotEmpty() flaggedById!: string;
  @IsString() @IsNotEmpty() reason!: string;
}

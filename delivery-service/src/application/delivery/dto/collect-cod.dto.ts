import { IsUUID } from 'class-validator';

export class CollectCodDto {
  @IsUUID()
  riderId!: string;
}

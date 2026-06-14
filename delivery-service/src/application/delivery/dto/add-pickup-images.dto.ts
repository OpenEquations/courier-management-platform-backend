import { ArrayMinSize, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddPickupImagesDto {
  @ApiProperty({ example: '7c1e9b2a-aaaa-4f7a-8c9d-0e1f2a3b4c5d', description: 'UUID of the rider capturing the photos' })
  @IsUUID()
  riderId!: string;

  @ApiProperty({
    type: [String],
    example: ['http://192.168.1.98:3010/deliveries/uploads/1718000000000-pickup.jpg'],
    description: 'URLs of pickup-condition photos uploaded via POST /deliveries/uploads',
  })
  @IsString({ each: true })
  @ArrayMinSize(1)
  imageUrls!: string[];
}

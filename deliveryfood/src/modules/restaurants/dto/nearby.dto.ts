// src/modules/restaurants/dto/nearby.dto.ts
import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NearbyDto {
  @ApiProperty({ example: 21.027764, description: 'Vĩ độ người dùng' })
  @IsNumber() @Min(-90) @Max(90)
  latitude: number;

  @ApiProperty({ example: 105.834160, description: 'Kinh độ người dùng' })
  @IsNumber() @Min(-180) @Max(180)
  longitude: number;

  @ApiProperty({ example: 5000, description: 'Bán kính tối đa (mét)' })
  @IsNumber() @Min(0)
  maxDistance: number;
}

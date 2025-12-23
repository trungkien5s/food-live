// src/restaurants/dto/geo-point.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ArrayMinSize, ArrayMaxSize, IsIn, IsNumber } from 'class-validator';

export class GeoPointDto {
  @ApiProperty({ enum: ['Point'], default: 'Point' })
  @IsIn(['Point'])
  type: 'Point' = 'Point';

  @ApiProperty({
    description: 'Thứ tự [lng, lat]',
    example: [106.7009, 10.7769],
    type: 'array',
    items: { type: 'number' },
  })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @IsNumber({}, { each: true })
  @Type(() => Number)
  coordinates: [number, number];
}

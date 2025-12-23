



// src/restaurants/dto/create-restaurant.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsNotEmpty, 
  IsOptional, 
  IsString, 
  IsNumber, 
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { GeoPointDto } from './geo-point.dto';
import { Prop } from '@nestjs/mongoose';

export class GeoPointWrapperDto {
  @ValidateNested()
  @Type(() => GeoPointDto)
  property: GeoPointDto;
}
export class CreateRestaurantDto {
  @ApiProperty({ example: 'Phở Thìn' })
  @IsString() 
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false }) 
  @IsOptional() 
  @IsString()
  description?: string;

  @ApiProperty({ required: false }) 
  @IsOptional() 
  @IsString()
  phone?: string;

  @ApiProperty({ required: false }) 
  @IsOptional() 
  @IsString()
  email?: string;

  // Thêm trường address
  @ApiProperty({ 
    example: '71 Triều Khúc',
    required: false 
  })


  @ApiProperty({ example: 4.5, required: false })
  @IsOptional() 
  @Type(() => Number) 
  @IsNumber({ maxDecimalPlaces: 2 })
  rating?: number;

  @ApiProperty({ required: false })
  @IsOptional() 
  @IsBoolean()
  isOpen?: boolean;

    @ApiProperty({ example: '123 Lý Thường Kiệt, Q.10', required: false })
  @IsOptional()
  @IsString()
  address?: string;


  @ApiProperty({ example: '08:00', required: false })
  @IsOptional() 
  @IsString()
  openTime?: string;

  @ApiProperty({ example: '22:00', required: false })
  @IsOptional() 
  @IsString()
  closeTime?: string;

  @ApiProperty({
    required: false,
    type: () => GeoPointDto,
    example: {
      type: 'Point',
      coordinates: [105.8, 20.9],
    },
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoPointDto)
  location?: GeoPointDto;
}
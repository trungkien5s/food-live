// src/modules/carts/dto/create-cart.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateCartDto {
  @IsOptional()
  @ApiProperty({ example: 'USER_ID', required: false })
  user?: string; // sẽ gán từ request user

  @IsNotEmpty()
  @ApiProperty({ example: 'RESTAURANT_ID', description: 'Nhà hàng của cart' })
  restaurant!: string;

  @IsOptional()
  @IsEnum(['active', 'ordered', 'abandoned'])
  status?: 'active' | 'ordered' | 'abandoned';

  @IsOptional() @IsNumber() subtotal?: number;
  @IsOptional() @IsNumber() deliveryFee?: number;
  @IsOptional() @IsNumber() discount?: number;
  @IsOptional() @IsNumber() total?: number;
}

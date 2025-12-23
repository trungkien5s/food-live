// src/modules/carts/dto/update-cart.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateCartDto } from './create-cart.dto';
import { IsEnum, IsOptional, IsNumber } from 'class-validator';

export class UpdateCartDto extends PartialType(CreateCartDto) {
  @IsOptional()
  @IsEnum(['active', 'ordered', 'abandoned'])
  status?: 'active' | 'ordered' | 'abandoned';

  @IsOptional() @IsNumber() subtotal?: number;
  @IsOptional() @IsNumber() deliveryFee?: number;
  @IsOptional() @IsNumber() discount?: number;
  @IsOptional() @IsNumber() total?: number;
}

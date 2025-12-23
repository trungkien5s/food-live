import { IsString, IsMongoId, IsOptional, IsNumber, Min, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class VerifyCouponDto {
  @IsString()
  @Transform(({ value }) => value?.toUpperCase().trim())
  code: string;

  @IsMongoId()
  restaurantId: string;

  @IsNumber()
  @Min(0)
  subtotal: number;

  @IsOptional()
  @IsMongoId()
  userId?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categoryIds?: string[]; // for category-specific coupons
}



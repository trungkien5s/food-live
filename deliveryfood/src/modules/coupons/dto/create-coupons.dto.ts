// dto/create-coupon.dto.ts
import { 
  IsString, 
  IsEnum, 
  IsNumber, 
  IsOptional, 
  IsBoolean, 
  IsDateString, 
  IsMongoId, 
  Min, 
  Max,
  IsArray,
  ValidateIf 
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CouponType, CouponScope } from '../schemas/coupon.schema';

export class CreateCouponDto {
  @IsString()
  @Transform(({ value }) => value?.toUpperCase().trim())
  code: string;

  @IsEnum(CouponType)
  type: CouponType;

  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.type === CouponType.PERCENT ? o.value <= 100 : true)
  value: number; // percent: 0-100, fixed: amount in VND

  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscount?: number;

  @IsOptional()
  @IsEnum(CouponScope)
  scope?: CouponScope;

  @IsOptional()
  @IsMongoId()
  @ValidateIf((o) => o.scope === CouponScope.RESTAURANT)
  restaurant?: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ValidateIf((o) => o.scope === CouponScope.CATEGORY)
  categories?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usageLimit?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimitPerUser?: number;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}



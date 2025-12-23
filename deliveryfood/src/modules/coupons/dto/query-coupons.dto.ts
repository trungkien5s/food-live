import { IsOptional, IsString, IsEnum, IsMongoId } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryCouponDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  active?: boolean;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsMongoId()
  restaurant?: string;
}
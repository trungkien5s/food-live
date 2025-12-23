import { IsInt, IsOptional, IsString, IsIn, IsMongoId, IsNumberString, IsBooleanString } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchQueryDto {
  @IsString() q: string;

  /** 'all' | 'restaurants' | 'menu-items' */
  @IsOptional() @IsIn(['all', 'restaurants', 'menu-items']) type?: 'all'|'restaurants'|'menu-items' = 'all';

  @IsOptional() @IsMongoId() categoryId?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsBooleanString() isOpen?: string;

  /** VND */
  @IsOptional() @IsNumberString() minPrice?: string;
  @IsOptional() @IsNumberString() maxPrice?: string;

  /** 'relevance' | 'rating' | 'price_asc' | 'price_desc' */
  @IsOptional() @IsIn(['relevance','rating','price_asc','price_desc']) sort?: string = 'relevance';

  @IsOptional() @Type(() => Number) @IsInt() page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() limit?: number = 20;

  /** Tọa độ để sort theo distance (tuỳ chọn) */
  @IsOptional() @IsString() lat?: string;
  @IsOptional() @IsString() lng?: string;
}

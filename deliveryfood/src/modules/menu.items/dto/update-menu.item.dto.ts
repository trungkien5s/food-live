import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsMongoId,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMenuItemDto {
  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ example: '662f4d27b9f8a1e05e1c1111', description: 'ID menu cha' })
  menu?: string;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ example: '662f4d27b9f8a1e05e1c2222', description: 'ID nhà hàng' })
  restaurant?: string;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ example: '662f4d27b9f8a1e05e1c3333', description: 'ID danh mục' })
  categoryId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Bún bò Huế', description: 'Tên món' })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Đặc sản Huế thơm ngon' })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 45000, description: 'Giá gốc' })
  basePrice?: number;

  /** ====== CÁC FIELD SALE (tùy chọn) ====== */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 39000, description: 'Giá sale' })
  salePrice?: number;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2025-08-13T00:00:00.000Z', description: 'Thời gian bắt đầu sale' })
  saleStartAt?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2025-08-20T23:59:59.000Z', description: 'Thời gian kết thúc sale' })
  saleEndAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 100, description: 'Tổng số lượng sale' })
  saleTotal?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 12, description: 'Đã bán trong đợt sale' })
  saleSold?: number;

  /** Ảnh: service sẽ set khi upload file, nhưng cho phép update thủ công nếu cần */
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../image.jpg' })
  image?: string;
}

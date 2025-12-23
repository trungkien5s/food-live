import {
  IsString,
  IsOptional,
  IsIn,
  IsBoolean,
  IsMobilePhone,
  IsUrl,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false, example: 'Nguyễn Văn B' })
  @IsOptional()
  @IsString()
  @Length(2, 50)
  name?: string;

  @ApiProperty({ required: false, example: '0901234567' })
  @IsOptional()
  @IsMobilePhone('vi-VN', {}, { message: 'Số điện thoại không hợp lệ' })
  phone?: string;

  @ApiProperty({ required: false, example: '123 Đường ABC, Quận 1, TP.HCM' })
  @IsOptional()
  @IsString()
  @Length(5, 100)
  address?: string;

  @ApiProperty({ required: false, example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl({}, { message: 'URL ảnh không hợp lệ' })
  image?: string;

  @ApiProperty({ required: false, example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, example: 'USERS', enum: ['USERS', 'ADMIN', 'SHIPPER', 'RESTAURANTS'] })
  @IsOptional()
  @IsIn(['USERS', 'ADMIN', 'SHIPPER', 'RESTAURANTS'], {
    message: 'Role phải là USERS, ADMIN hoặc SHIPPER',
  })
  role?: string;
}

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsOptional,
    IsNumber,
    IsString,
    IsDateString,
    IsMongoId,
    IsIn,
    Min,
} from 'class-validator';

export class QueryOrdersDto {
    @ApiPropertyOptional({
        description: 'Số trang',
        example: 1,
        minimum: 1,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Số lượng mỗi trang',
        example: 10,
        minimum: 1,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Trạng thái đơn hàng',
        example: 'PENDING',
    })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({
        description: 'Phương thức thanh toán',
        example: 'CASH',
    })
    @IsOptional()
    @IsString()
    paymentMethod?: string;

    @ApiPropertyOptional({
        description: 'Trạng thái thanh toán',
        example: 'PAID',
    })
    @IsOptional()
    @IsString()
    paymentStatus?: string;
}

export class QueryRevenueAnalyticsDto {
    @ApiPropertyOptional({
        description: 'Ngày bắt đầu',
        example: '2025-01-01',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'Ngày kết thúc',
        example: '2025-12-31',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({
        description: 'ID nhà hàng',
        example: '64e3c4ba1f9b8b001a0c1234',
    })
    @IsOptional()
    @IsMongoId()
    restaurantId?: string;

    @ApiPropertyOptional({
        description: 'Chu kỳ thống kê',
        example: 'day',
        enum: ['day', 'week', 'month'],
    })
    @IsOptional()
    @IsString()
    @IsIn(['day', 'week', 'month'])
    period?: 'day' | 'week' | 'month' = 'day';
}

export class QueryPerformanceAnalyticsDto {
    @ApiPropertyOptional({
        description: 'Ngày bắt đầu',
        example: '2025-01-01',
    })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({
        description: 'Ngày kết thúc',
        example: '2025-12-31',
    })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}

export class QueryAvailableOrdersDto {
    @ApiPropertyOptional({
        description: 'Khoảng cách tối đa (km)',
        example: 10,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    maxDistance?: number = 10;

    @ApiPropertyOptional({
        description: 'Vĩ độ hiện tại của shipper',
        example: 21.0285,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    lat?: number;

    @ApiPropertyOptional({
        description: 'Kinh độ hiện tại của shipper',
        example: 105.8542,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    lng?: number;
}

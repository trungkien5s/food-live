import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    ValidateNested,
    IsDateString,
    Min,
    Max,
} from 'class-validator';
import { DeliveryAddressDto, OrderFeesDto } from './create-order.dto';
import { PaymentMethod } from '../schemas/order.schema';

export class CreateOrderFromCartDto {
    @ApiProperty({
        description: 'Địa chỉ giao hàng',
        type: DeliveryAddressDto,
    })
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => DeliveryAddressDto)
    deliveryAddress: DeliveryAddressDto;

    @ApiPropertyOptional({
        description: 'Khoảng cách từ nhà hàng đến địa chỉ giao hàng (km)',
        example: 5.2,
        minimum: 0.1,
        maximum: 50,
    })
    @IsOptional()
    @IsNumber()
    @Min(0.1)
    @Max(50)
    distanceKm?: number;

    @ApiPropertyOptional({
        description: 'Thời gian giao hàng dự kiến (phút)',
        example: 30,
        minimum: 10,
        maximum: 120,
    })
    @IsOptional()
    @IsNumber()
    @Min(10)
    @Max(120)
    estimatedDeliveryMinutes?: number;

    @ApiPropertyOptional({
        description: 'Phương thức thanh toán',
        enum: PaymentMethod,
        example: PaymentMethod.CASH,
    })
    @IsOptional()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional({
        description: 'Thông tin phí',
        type: OrderFeesDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => OrderFeesDto)
    fees?: OrderFeesDto;

    @ApiPropertyOptional({
        description: 'Ghi chú cho nhà hàng',
        example: 'Không cay, ít dầu mỡ',
    })
    @IsOptional()
    @IsString()
    orderNote?: string;

    @ApiPropertyOptional({
        description: 'Ghi chú cho shipper',
        example: 'Gọi trước khi giao, để ở bảo vệ',
    })
    @IsOptional()
    @IsString()
    deliveryNote?: string;

    @ApiPropertyOptional({
        description: 'Mã giảm giá (nếu có)',
        example: 'DISCOUNT20',
    })
    @IsOptional()
    @IsString()
    couponCode?: string;

    @ApiPropertyOptional({
        description: 'Thời gian đặt hàng (mặc định là hiện tại)',
        example: '2025-07-02T09:58:01.044Z',
    })
    @IsOptional()
    @IsDateString()
    orderTime?: Date;

    @ApiPropertyOptional({
        description: 'Thời gian chuẩn bị món (phút)',
        example: 20,
    })
    @IsOptional()
    @IsNumber()
    estimatedPreparationMinutes?: number;

    @ApiPropertyOptional({
        description: 'Phí dịch vụ',
        example: 5000,
    })
    @IsOptional()
    @IsNumber()
    serviceFee?: number;

    @ApiPropertyOptional({
        description: 'Giảm giá',
        example: 10000,
    })
    @IsOptional()
    @IsNumber()
    discount?: number;

    @ApiPropertyOptional({
        description: 'Thuế VAT',
        example: 8000,
    })
    @IsOptional()
    @IsNumber()
    tax?: number;
}

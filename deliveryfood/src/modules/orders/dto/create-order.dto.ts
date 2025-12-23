import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  Min,
  Max,
  ValidateNested,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { PaymentMethod } from '../schemas/order.schema';

// DTO cho địa chỉ giao hàng
export class DeliveryAddressDto {
  @ApiProperty({
    description: 'Số nhà, tên đường',
    example: '123 Nguyễn Du'
  })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({
    description: 'Phường/Xã',
    example: 'Phường Hai Bà Trưng'
  })


  @ApiProperty({
    description: 'Thành phố',
    example: 'Hà Nội'
  })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    description: 'Địa chỉ đầy đủ',
    example: '123 Nguyễn Du, Phường Hai Bà Trưng, Quận Hoàn Kiếm, Hà Nội'
  })
  @IsString()
  @IsNotEmpty()
  fullAddress: string;

  @ApiPropertyOptional({
    description: 'Ghi chú địa chỉ',
    example: 'Tòa nhà A, tầng 3, cửa số 301'
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Tên người nhận',
    example: 'Nguyễn Văn A'
  })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({
    description: 'Số điện thoại người nhận',
    example: '0987654321'
  })
  @IsString()
  @IsNotEmpty()
  recipientPhone: string;

  @ApiProperty({
    description: 'Tọa độ địa chỉ [longitude, latitude]',
    example: [105.8542, 21.0285],
    type: [Number]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: [number, number];
}

// DTO cho thông tin phí
export class OrderFeesDto {
  @ApiProperty({
    description: 'Tổng tiền món ăn',
    example: 150000
  })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({
    description: 'Phí giao hàng',
    example: 20000
  })
  @IsNumber()
  @Min(0)
  deliveryFee: number;

  @ApiPropertyOptional({
    description: 'Phí dịch vụ',
    example: 5000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  serviceFee?: number;

  @ApiPropertyOptional({
    description: 'Giảm giá',
    example: 10000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({
    description: 'Thuế VAT',
    example: 8000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @ApiProperty({
    description: 'Tổng cộng',
    example: 173000
  })
  @IsNumber()
  @Min(0)
  totalAmount: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Array of CartItem IDs to create order from',
    example: ['64e3c4ba1f9b8b001a0c1234', '64e3c4ba1f9b8b001a0c5678'],
    type: [String]
  })
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsMongoId({ each: true })
  cartItemIds: string[];

  @ApiProperty({
    description: 'Địa chỉ giao hàng',
    type: DeliveryAddressDto
  })
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress: DeliveryAddressDto;

  @ApiProperty({
    description: 'Khoảng cách từ nhà hàng đến địa chỉ giao hàng (km)',
    example: 5.2,
    minimum: 0.1,
    maximum: 50
  })
  @IsNumber()
  @Min(0.1)
  @Max(50)
  distanceKm: number;

  @ApiProperty({
    description: 'Thời gian giao hàng dự kiến (phút)',
    example: 30,
    minimum: 10,
    maximum: 120
  })
  @IsNumber()
  @Min(10)
  @Max(120)
  estimatedDeliveryMinutes: number;

  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    example: PaymentMethod.CASH
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Thông tin phí',
    type: OrderFeesDto
  })
  @ValidateNested()
  @Type(() => OrderFeesDto)
  fees: OrderFeesDto;

  @ApiPropertyOptional({
    description: 'Ghi chú cho nhà hàng',
    example: 'Không cay, ít dầu mỡ'
  })
  @IsOptional()
  @IsString()
  orderNote?: string;

  @ApiPropertyOptional({
    description: 'Ghi chú cho shipper',
    example: 'Gọi trước khi giao, để ở bảo vệ'
  })
  @IsOptional()
  @IsString()
  deliveryNote?: string;

  @ApiPropertyOptional({
    description: 'Mã giảm giá (nếu có)',
    example: 'DISCOUNT20'
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Thời gian đặt hàng (mặc định là hiện tại)',
    example: '2025-07-02T09:58:01.044Z'
  })
  @IsOptional()
  @IsDateString()
  orderTime?: Date;

  @ApiPropertyOptional({
    description: 'ID giao dịch thanh toán (cho thanh toán online)',
    example: 'TXN_123456789'
  })
  @IsOptional()
  @IsString()
  paymentTransactionId?: string;
}

// DTO cho việc cập nhật địa chỉ giao hàng
export class UpdateDeliveryAddressDto {
  @ApiPropertyOptional({
    description: 'Địa chỉ giao hàng mới',
    type: DeliveryAddressDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  deliveryAddress?: DeliveryAddressDto;

  @ApiPropertyOptional({
    description: 'Khoảng cách mới (km)',
    example: 3.5
  })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(50)
  distanceKm?: number;

  @ApiPropertyOptional({
    description: 'Thời gian giao hàng dự kiến mới (phút)',
    example: 25
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(120)
  estimatedDeliveryMinutes?: number;

  @ApiPropertyOptional({
    description: 'Phí giao hàng mới',
    example: 15000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number;
}

// DTO cho việc cập nhật vị trí shipper (realtime tracking)
export class UpdateShipperLocationDto {
  @ApiProperty({
    description: 'Tọa độ hiện tại của shipper [longitude, latitude]',
    example: [105.8542, 21.0285]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: [number, number];
}

// DTO cho đánh giá đơn hàng
export class RateOrderDto {
  @ApiProperty({
    description: 'Đánh giá từ 1-5 sao',
    example: 5,
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Bình luận đánh giá',
    example: 'Món ăn ngon, shipper giao nhanh!'
  })
  @IsOptional()
  @IsString()
  comment?: string;
}

// DTO cho việc hủy đơn hàng
export class CancelOrderDto {
  @ApiProperty({
    description: 'Lý do hủy đơn',
    example: 'Thay đổi ý định'
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Người hủy đơn',
    example: 'user',
    enum: ['USER', 'restaurant', 'shipper', 'system']
  })
  @IsOptional()
  @IsString()
  cancelledBy?: string;
}
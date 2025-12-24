import { Restaurant } from '@/modules/restaurants/schemas/restaurant.schema';
import { User } from '@/modules/users/schemas/user.schema';
import { Shipper } from '@/modules/shippers/schemas/shipper.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Optional } from '@nestjs/common';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING = 'PENDING', // Mới tạo, chưa có shipper
  CONFIRMED = 'CONFIRMED', // Nhà hàng xác nhận
  PREPARING = 'PREPARING', // Nhà hàng đang chuẩn bị
  READY = 'READY', // Món đã sẵn sàng
  ASSIGNED = 'ASSIGNED', // Đã gán shipper
  PICKING_UP = 'PICKING_UP', // Shipper đang đến lấy hàng
  DELIVERING = 'DELIVERING', // Shipper đang giao
  DELIVERED = 'DELIVERED', // Giao thành công
  CANCELLED = 'CANCELLED', // Bị hủy
}

export enum PaymentMethod {
  CASH = 'CASH', // Thanh toán tiền mặt
  CARD = 'CARD', // Thanh toán thẻ
  MOMO = 'MOMO', // Ví MoMo
  ZALOPAY = 'ZALOPAY', // ZaloPay
  VNPAY = 'VNPAY', // VNPay
  BANKING = 'BANKING', // Internet Banking
}

export enum PaymentStatus {
  PENDING = 'PENDING', // Chờ thanh toán
  PAID = 'PAID', // Đã thanh toán
  FAILED = 'FAILED', // Thanh toán thất bại
  REFUNDED = 'REFUNDED', // Đã hoàn tiền
}

// Schema cho địa chỉ giao hàng
@Schema({ _id: false })
export class DeliveryAddress {
  @Prop({ required: true })
  street: string; // Số nhà, tên đường

  @Prop({ required: true })
  city: string; // Thành phố

  @Prop({ required: true })
  fullAddress: string; // Địa chỉ đầy đủ

  @Prop()
  note?: string; // Ghi chú địa chỉ (ví dụ: "Tòa nhà A, tầng 3")

  @Prop({ required: true })
  recipientName: string; // Tên người nhận

  @Prop({ required: true })
  recipientPhone: string; // Số điện thoại người nhận

  @Prop({ type: [Number], required: true })
  coordinates: [number, number]; // [longitude, latitude]
}

// Schema cho thông tin phí
@Schema({ _id: false })
export class OrderFees {
  @Prop({ required: true, default: 0 })
  subtotal: number; // Tổng tiền món ăn

  @Prop({ required: true, default: 0 })
  deliveryFee: number; // Phí giao hàng

  @Prop({ default: 0 })
  serviceFee: number; // Phí dịch vụ

  @Prop({ default: 0 })
  discount: number; // Giảm giá

  @Prop({ default: 0 })
  tax: number; // Thuế VAT

  @Prop({ required: true })
  totalAmount: number; // Tổng cộng
}

// Schema cho thông tin thời gian
@Schema({ _id: false })
export class OrderTiming {
  @Prop({ default: () => new Date() })
  orderTime: Date; // Thời gian đặt hàng

  @Prop()
  confirmedTime?: Date; // Thời gian nhà hàng xác nhận

  @Prop()
  preparingTime?: Date; // Thời gian bắt đầu chuẩn bị

  @Prop()
  readyTime?: Date; // Thời gian món đã sẵn sàng

  @Prop()
  assignedTime?: Date; // Thời gian gán shipper

  @Prop()
  pickedUpTime?: Date; // Thời gian shipper lấy hàng

  @Prop()
  deliveredTime?: Date; // Thời gian giao thành công

  @Prop()
  estimatedDeliveryTime?: Date; // Thời gian giao hàng dự kiến

  @Prop()
  actualDeliveryTime?: Date; // Thời gian giao hàng thực tế
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Restaurant.name, required: true })
  restaurant: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name, required: true })
  user: mongoose.Schema.Types.ObjectId;

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  // Thông tin địa chỉ giao hàng
  @Prop({ type: DeliveryAddress, required: true })
  deliveryAddress: DeliveryAddress;

  // Thông tin khoảng cách và thời gian
  @Prop({ required: true })
  distanceKm: number; // Khoảng cách từ nhà hàng đến địa chỉ giao hàng (km)

  @Prop({ required: true })
  estimatedDeliveryMinutes: number; // Thời gian giao hàng dự kiến (phút)

  // Thông tin thanh toán
  @Prop({ enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop()
  paymentTransactionId?: string; // ID giao dịch thanh toán

  // Thông tin phí
  @Prop({ type: OrderFees, required: true })
  fees: OrderFees;

  // Thông tin thời gian
  @Prop({ type: OrderTiming, required: true })
  timing: OrderTiming;

  // Shipper
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Shipper.name, default: null })
  shipper: mongoose.Types.ObjectId;

  // Ghi chú đơn hàng
  @Prop()
  orderNote?: string; // Ghi chú cho nhà hàng

  @Prop()
  deliveryNote?: string; // Ghi chú cho shipper

  // Thông tin đánh giá
  @Prop({ min: 1, max: 5 })
  rating?: number; // Đánh giá từ 1-5 sao

  @Prop()
  ratingComment?: string; // Bình luận đánh giá

  @Prop()
  ratingTime?: Date; // Thời gian đánh giá

  // Mã giảm giá đã sử dụng
  @Prop()
  couponCode?: string;

  // Lý do hủy đơn (nếu có)
  @Prop()
  cancellationReason?: string;

  @Prop()
  cancelledBy?: string; // 'user', 'restaurant', 'shipper', 'system'

  @Prop()
  cancelledTime?: Date;

  // Trạng thái hoàn tiền
  @Prop({ default: false })
  isRefunded: boolean;

  @Prop()
  refundAmount?: number;

  @Prop()
  refundTime?: Date;

  // Thông tin theo dõi realtime
  @Prop({ type: [Number] })
  shipperCurrentLocation?: [number, number]; // [longitude, latitude]

  @Prop()
  lastLocationUpdate?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Tạo index cho các trường thường được query
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ restaurant: 1, createdAt: -1 });
OrderSchema.index({ shipper: 1, status: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'deliveryAddress.coordinates': '2dsphere' }); // Geo index
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type PaymentDocument = HydratedDocument<Payment>;
export enum PaymentStatus { PENDING='pending', REQUIRES_ACTION='requires_action', SUCCEEDED='succeeded', FAILED='failed', CANCELED='canceled' }

@Schema({ timestamps: true })
export class Payment {
  _id: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true })
  order: mongoose.Types.ObjectId;

  @Prop({ required: true }) provider: 'stripe' | 'momo' | 'vnpay' | 'zalopay';

  @Prop({ required: true, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop({ required: true, min: 0 }) amount: number;   // VND (integer)
  @Prop({ default: 'VND' }) currency: string;

  @Prop() providerPaymentId?: string;  // payment_intent id, momoOrderId, etc
  @Prop() providerClientSecret?: string; // Stripe client_secret (nếu trả về cho FE)

  @Prop({ type: Object }) meta?: any;  // lưu response provider
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.index({ order: 1 });

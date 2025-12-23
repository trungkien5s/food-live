import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";

export type CouponDocument = HydratedDocument<Coupon>;

export enum CouponType { PERCENT = 'percent', FIXED = 'fixed' }
export enum CouponScope { GLOBAL='global', RESTAURANT='restaurant', CATEGORY='category' }

@Schema({ timestamps: true })
export class Coupon {
  _id: mongoose.Types.ObjectId;

  @Prop({ required: true, uppercase: true, trim: true })
  code: string;                            // ABCXYZ

  @Prop({ enum: CouponType, required: true })
  type: CouponType;                        // percent/fixed

  @Prop({ required: true, min: 0 })
  value: number;                           // 10(%) hoặc 20000(VND)

  @Prop({ default: 0, min: 0 })
  maxDiscount?: number;                    // trần giảm cho percent

  @Prop({ enum: CouponScope, default: CouponScope.GLOBAL })
  scope: CouponScope;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: false })
  restaurant?: mongoose.Types.ObjectId;    // nếu scope=RESTAURANT

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'Category', default: [] })
  categories?: mongoose.Types.ObjectId[];  // nếu scope=CATEGORY (optional)

  @Prop({ default: 0, min: 0 })
  minOrderAmount?: number;                 // tối thiểu để áp

  @Prop({ default: 0, min: 0 })
  usageLimit?: number;                     // tổng số lượt (0 = không giới hạn)

  @Prop({ default: 1, min: 0 })
  usageLimitPerUser?: number;              // mỗi user

  @Prop({ type: Date })
  startsAt?: Date;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Map, of: Number, default: {} })
  usedByUserCounts: Map<string, number>;   // userId -> count

  @Prop({ default: 0 })
  usedCount: number;                       // tổng đã dùng
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

// Indexes
CouponSchema.index({ code: 1 }, { unique: true });
CouponSchema.index({ isActive: 1, expiresAt: 1 });

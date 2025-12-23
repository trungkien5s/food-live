// src/modules/carts/schemas/carts.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type CartDocument = HydratedDocument<Cart>;

export type CartStatus = 'active' | 'ordered' | 'abandoned';

@Schema({ timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } })
export class Cart {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: mongoose.Schema.Types.ObjectId;

  // Mỗi cart gắn với đúng 1 nhà hàng
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true })
  restaurant: mongoose.Schema.Types.ObjectId;

  @Prop({ type: String, enum: ['active', 'ordered', 'abandoned'], default: 'active' })
  status: CartStatus;

  // (tùy chọn) cache tiền để FE hiển thị nhanh
  @Prop({ type: Number, default: 0 })
  subtotal: number;

  @Prop({ type: Number, default: 0 })
  deliveryFee: number;

  @Prop({ type: Number, default: 0 })
  discount: number;

  @Prop({ type: Number, default: 0 })
  total: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);

// Dùng virtual để populate items thay vì lưu mảng _id trong Cart
CartSchema.virtual('items', {
  ref: 'CartItem',
  localField: '_id',
  foreignField: 'cart',
});

// UNIQUE: chỉ cho phép 1 cart ACTIVE cho mỗi (user, restaurant)
CartSchema.index(
  { user: 1, restaurant: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

// Phổ biến để truy vấn nhanh
CartSchema.index({ user: 1, createdAt: -1 });

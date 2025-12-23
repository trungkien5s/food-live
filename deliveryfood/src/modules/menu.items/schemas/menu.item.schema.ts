import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MenuItem {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Menu', required: true })
  menu: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Restaurant', required: true })
  restaurant: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: false })
  categoryId?: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ index: true }) searchKey?: string;

  @Prop({ type: [String], index: true })
  searchTokens?: string[];

  @Prop({ type: Number, required: true, min: 0 })
  basePrice: number;

  @Prop()
  image?: string;

  // <<< BỔ SUNG >>>
}

export type MenuItemDocument = HydratedDocument<MenuItem>;
export const MenuItemSchema = SchemaFactory.createForClass(MenuItem);
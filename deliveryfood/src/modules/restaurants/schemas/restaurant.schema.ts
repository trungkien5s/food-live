// src/restaurants/schemas/restaurant.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// GeoJSON Point schema
@Schema({ _id: false })
export class GeoPoint {
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  type: string;

  @Prop({
    type: [Number],
    index: '2dsphere',
    required: true,
    description: 'Coordinates as [longitude, latitude]',
  })
  coordinates: [number, number]; // [longitude, latitude]
}

export const GeoPointSchema = SchemaFactory.createForClass(GeoPoint);

@Schema({ timestamps: true })
export class Restaurant {
  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  phone?: string;

  @Prop()
  email?: string;

  @Prop()
  image?: string;

  @Prop({ type: Number, min: 0, max: 5 })
  rating?: number;

  @Prop({ default: true })
  isOpen?: boolean;

  @Prop()
  address?: string;

  @Prop()
  openTime?: string;

  @Prop()
  closeTime?: string;

  // // ====== LOCATION FIELD ======
  // @Prop({ type: GeoPointSchema, required: true })
  // location: GeoPoint;
}

export type RestaurantDocument = Restaurant & Document;
export const RestaurantSchema = SchemaFactory.createForClass(Restaurant);

// Ensure 2dsphere index on location
RestaurantSchema.index({ location: '2dsphere' });

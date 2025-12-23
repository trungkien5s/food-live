import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose from "mongoose";

@Schema({ timestamps: true })
export class SearchLog {
  @Prop({ required: true, trim: true }) keyword: string;
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' }) user?: mongoose.Types.ObjectId;
  @Prop({ type: Object }) filters?: any; // Lưu bộ lọc nếu có
  @Prop({ default: 1 }) count: number;   // Số lần tìm kiếm keyword này
}

export const SearchLogSchema = SchemaFactory.createForClass(SearchLog);

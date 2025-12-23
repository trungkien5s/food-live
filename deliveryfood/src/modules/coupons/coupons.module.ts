import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CouponsService } from './coupons.service';
import { Coupon, CouponSchema } from './schemas/coupon.schema';
import { CouponsController } from './coupons.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ 
      name: Coupon.name, 
      schema: CouponSchema 
    }]),
  ],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService], // for use in Orders/Payments modules
})
export class CouponsModule {}
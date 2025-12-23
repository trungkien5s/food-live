import { PartialType } from '@nestjs/mapped-types';
import { CreateCouponDto } from './create-coupons.dto';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
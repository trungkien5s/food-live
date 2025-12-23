import { 
  BadRequestException, 
  Injectable, 
  NotFoundException,
  ConflictException 
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
import { Coupon, CouponDocument, CouponType, CouponScope } from './schemas/coupon.schema';
import { QueryCouponDto } from './dto/query-coupons.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { VerifyCouponDto } from './dto/verify-coupoun.dto';
import { CreateCouponDto } from './dto/create-coupons.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>
  ) {}

  async create(dto: CreateCouponDto): Promise<CouponDocument> {
    try {
      // Additional validation
      if (dto.type === CouponType.PERCENT && dto.value > 100) {
        throw new BadRequestException('Percent discount cannot exceed 100%');
      }

      if (dto.startsAt && dto.expiresAt && new Date(dto.startsAt) >= new Date(dto.expiresAt)) {
        throw new BadRequestException('Start date must be before expiration date');
      }

      const coupon = new this.couponModel({
        ...dto,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      });

      return await coupon.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Coupon code already exists');
      }
      throw error;
    }
  }

  async findAll(query: QueryCouponDto) {
    const filter: any = {};
    
    if (query.q) {
      filter.code = { $regex: query.q, $options: 'i' };
    }
    
    if (query.active !== undefined) {
      filter.isActive = query.active;
    }
    
    if (query.scope) {
      filter.scope = query.scope;
    }
    
    if (query.restaurant) {
      filter.restaurant = query.restaurant;
    }

    return await this.couponModel
      .find(filter)
      .populate('restaurant', 'name')
      .populate('categories', 'name')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string): Promise<CouponDocument> {
    const coupon = await this.couponModel
      .findById(id)
      .populate('restaurant', 'name')
      .populate('categories', 'name');
    
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto): Promise<CouponDocument> {
    try {
      const updateData: any = { ...dto };
      
      if (dto.startsAt) updateData.startsAt = new Date(dto.startsAt);
      if (dto.expiresAt) updateData.expiresAt = new Date(dto.expiresAt);

      const coupon = await this.couponModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!coupon) {
        throw new NotFoundException('Coupon not found');
      }

      return coupon;
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictException('Coupon code already exists');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.couponModel.findByIdAndDelete(id);
    if (!result) {
      throw new NotFoundException('Coupon not found');
    }
  }

  async toggleStatus(id: string): Promise<CouponDocument> {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    coupon.isActive = !coupon.isActive;
    return await coupon.save();
  }

  async getUsageStats(id: string) {
    const coupon = await this.couponModel.findById(id);
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const totalUsed = coupon.usedCount;
    const remainingUses = coupon.usageLimit > 0 ? coupon.usageLimit - totalUsed : 'Unlimited';
    const userUsageCounts = Object.fromEntries(coupon.usedByUserCounts || new Map());

    return {
      totalUsed,
      usageLimit: coupon.usageLimit || 'Unlimited',
      remainingUses,
      userUsageCounts,
      isActive: coupon.isActive,
      isExpired: coupon.expiresAt ? new Date() > coupon.expiresAt : false,
    };
  }

  async verifyAndPrice(dto: VerifyCouponDto) {
    const now = new Date();
    const coupon = await this.couponModel.findOne({ 
      code: dto.code,
      isActive: true 
    });

    if (!coupon) {
      throw new BadRequestException('Invalid or inactive coupon code');
    }

    // Time validations
    if (coupon.startsAt && now < coupon.startsAt) {
      throw new BadRequestException('Coupon is not yet active');
    }

    if (coupon.expiresAt && now > coupon.expiresAt) {
      throw new BadRequestException('Coupon has expired');
    }

    // Minimum order amount
    if (coupon.minOrderAmount && dto.subtotal < coupon.minOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount is ${coupon.minOrderAmount.toLocaleString()}đ`
      );
    }

    // Scope validations
    if (coupon.scope === CouponScope.RESTAURANT) {
      if (!coupon.restaurant || String(coupon.restaurant) !== String(dto.restaurantId)) {
        throw new BadRequestException('This coupon is only valid for a specific restaurant');
      }
    }

    if (coupon.scope === CouponScope.CATEGORY) {
      if (!dto.categoryIds || dto.categoryIds.length === 0) {
        throw new BadRequestException('Category information required for this coupon');
      }
      
      const hasValidCategory = coupon.categories?.some(catId => 
        dto.categoryIds!.includes(String(catId))
      );
      
      if (!hasValidCategory) {
        throw new BadRequestException('This coupon is not valid for the selected categories');
      }
    }

    // Usage limits
    if (coupon.usageLimitPerUser > 0 && dto.userId) {
      const userUsageCount = coupon.usedByUserCounts?.get(dto.userId) || 0;
      if (userUsageCount >= coupon.usageLimitPerUser) {
        throw new BadRequestException(
          `You have reached the maximum usage limit (${coupon.usageLimitPerUser}) for this coupon`
        );
      }
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit has been reached');
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === CouponType.PERCENT) {
      discountAmount = (dto.subtotal * coupon.value) / 100;
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = coupon.value;
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, dto.subtotal);
    const total = Math.max(0, dto.subtotal - discountAmount);

    return {
      coupon,
      discount: Math.round(discountAmount),
      total: Math.round(total)
    };
  }

  /** Mark coupon as used - call within transaction when creating order */
  async markRedeemed(
    couponId: string, 
    userId?: string, 
    session?: ClientSession
  ): Promise<void> {
    const updateQuery: any = {
      $inc: { usedCount: 1 }
    };

    if (userId) {
      updateQuery.$inc[`usedByUserCounts.${userId}`] = 1;
    }

    const result = await this.couponModel.findOneAndUpdate(
      { _id: couponId, isActive: true },
      updateQuery,
      { session, new: true }
    );

    if (!result) {
      throw new BadRequestException('Unable to redeem coupon');
    }
  }

  /** Get coupon by code (for internal use) */
  async findByCode(code: string): Promise<CouponDocument | null> {
    return await this.couponModel.findOne({ 
      code: code.toUpperCase(), 
      isActive: true 
    });
  }

  /** Clean up expired coupons */
  async cleanupExpired(): Promise<number> {
    const result = await this.couponModel.updateMany(
      { 
        expiresAt: { $lt: new Date() },
        isActive: true 
      },
      { isActive: false }
    );
    
    return result.modifiedCount;
  }
}
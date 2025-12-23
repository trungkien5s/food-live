// src/modules/carts/carts.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { Cart, CartDocument } from './schemas/carts.schema';

@Injectable()
export class CartsService {
  constructor(@InjectModel(Cart.name) private cartModel: Model<CartDocument>) {}

  private basePopulate() {
    return [
      { path: 'restaurant', select: 'name address image isOpen' },
      {
        path: 'items',
        populate: [
          { path: 'menuItem', select: 'name image basePrice restaurant' },
          { path: 'selectedOptions', select: 'name priceDelta' },
        ],
      },
    ];
  }

  /**
   * Lấy (hoặc tạo) cart ACTIVE theo (user, restaurant)
   * Giúp FE gọi 1 phát là có cart để thêm item tiếp.
   */
  async getOrCreateActive(userId: string, restaurantId: string, payload: Partial<CreateCartDto> = {}) {
    if (!isValidObjectId(userId) || !isValidObjectId(restaurantId)) {
      throw new NotFoundException('INVALID_ID');
    }

    let cart = await this.cartModel
      .findOne({ user: userId, restaurant: restaurantId, status: 'active' })
      .populate(this.basePopulate());

    if (!cart) {
      cart = await this.cartModel.create({
        user: userId,
        restaurant: restaurantId,
        status: 'active',
        subtotal: 0,
        deliveryFee: payload.deliveryFee ?? 0,
        discount: 0,
        total: 0,
      });
      cart = await cart.populate(this.basePopulate());
    }
    return cart;
  }

  /** Danh sách các cart ACTIVE của user (mỗi nhà hàng 1 cart) */
  findActiveByUser(userId: string) {
    return this.cartModel
      .find({ user: userId, status: 'active' })
      .sort({ updatedAt: -1 })
      .populate(this.basePopulate());
  }

  /** Lấy cart ACTIVE theo nhà hàng */
  async findActiveByUserAndRestaurant(userId: string, restaurantId: string) {
    const cart = await this.cartModel
      .findOne({ user: userId, restaurant: restaurantId, status: 'active' })
      .populate(this.basePopulate());
    if (!cart) throw new NotFoundException('CART_NOT_FOUND');
    return cart;
  }

  /** Tạo cart (thường không cần gọi trực tiếp, dùng getOrCreateActive) */
  async create(userId: string, dto: CreateCartDto) {
    return this.getOrCreateActive(userId, dto.restaurant, dto);
  }

  /** Cập nhật cart ACTIVE theo (user, restaurant) */
  async update(userId: string, restaurantId: string, dto: UpdateCartDto) {
    const cart = await this.cartModel
      .findOneAndUpdate(
        { user: userId, restaurant: restaurantId, status: 'active' },
        dto,
        { new: true },
      )
      .populate(this.basePopulate());

    if (!cart) throw new NotFoundException('CART_NOT_FOUND');
    return cart;
  }

  /** Xoá cart ACTIVE theo (user, restaurant) */
  async remove(userId: string, restaurantId: string) {
    const cart = await this.cartModel.findOneAndDelete({
      user: userId,
      restaurant: restaurantId,
      status: 'active',
    });
    if (!cart) throw new NotFoundException('CART_NOT_FOUND');
    return { deleted: true };
  }
}

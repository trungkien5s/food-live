// src/modules/cart.items/cart.items.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId, FilterQuery } from 'mongoose';
import { CartItem, CartItemDocument } from './schemas/cart.items.schema';
import { MenuItem } from '@/modules/menu.items/schemas/menu.item.schema';
import { MenuItemOption } from '@/modules/menu.item.options/schemas/menu.item.option.schema';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart } from '../carts/schemas/carts.schema';
import { Menu } from '@/modules/menus/schemas/menu.schema';
import { Restaurant } from '@/modules/restaurants/schemas/restaurant.schema';

/**
 * Type for MenuItem when populated with nested menu and restaurant
 */
interface PopulatedMenuItem extends Omit<MenuItem, 'menu' | 'restaurant'> {
  menu: (Menu & {
    restaurant: Restaurant & { _id: Types.ObjectId };
  }) | Types.ObjectId | null;
  restaurant: Types.ObjectId;
}

@Injectable()
export class CartItemsService {
  constructor(
    @InjectModel(CartItem.name)
    private readonly cartItemModel: Model<CartItemDocument>,

    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItem>,

    @InjectModel(MenuItemOption.name)
    private readonly menuItemOptionModel: Model<MenuItemOption>,
    @InjectModel(Restaurant.name)
private readonly restaurantModel: Model<Restaurant>,


    @InjectModel(Cart.name)
    private readonly cartModel: Model<Cart>,
  ) { }

  async findAllByUser(userId: string) {
  if (!isValidObjectId(userId)) throw new BadRequestException('userId không hợp lệ');
  const userObjectId = new Types.ObjectId(userId);

  const carts = await this.cartModel
    .find({ user: userObjectId, status: 'active' })
    .select('_id');

  if (!carts.length) return [];
  const cartIds = carts.map(c => c._id);

  const items = await this.cartItemModel
    .find({ cart: { $in: cartIds } })
    .populate({
      path: 'menuItem',
      match: { isDeleted: false, isActive: true },         // ✅ chặn món đã ẩn
      populate: {
        path: 'menu',
        match: { isDeleted: false, isActive: true },       // ✅ chặn menu đã ẩn
        populate: {
          path: 'restaurant',
          match: { isDeleted: false, isActive: true },     // ✅ chặn nhà hàng đã ẩn
          select: '_id name image',
        },
      },
    })
    .populate('selectedOptions')
    .lean();

  // ✅ loại bỏ item không còn hợp lệ (menuItem/menu/restaurant bị null do match)
  return items.filter((it: any) => it.menuItem && it.menuItem.menu && it.menuItem.menu.restaurant);
}



  async create(userId: string, dto: CreateCartItemDto) {
  if (!isValidObjectId(userId)) throw new BadRequestException('userId không hợp lệ');
  if (!isValidObjectId(dto.menuItem)) throw new NotFoundException('MenuItem ID không hợp lệ');

  // 1) Lấy menuItem + menu + restaurant, có match isDeleted/isActive
  const newMenuItem = await this.menuItemModel
    .findOne({ _id: dto.menuItem, isDeleted: false, isActive: true })
    .populate({
      path: 'menu',
      match: { isDeleted: false, isActive: true },
      select: '_id restaurant',
      populate: {
        path: 'restaurant',
        match: { isDeleted: false, isActive: true },
        select: '_id',
      },
    })
    .lean<PopulatedMenuItem | null>();

  // Nếu menu bị ẩn/deleted => populate ra null
  if (!newMenuItem) throw new BadRequestException('Món ăn không còn khả dụng');
  if (!newMenuItem.menu || typeof newMenuItem.menu !== 'object')
    throw new BadRequestException('Menu/nhà hàng không còn khả dụng');

  const populatedMenu = newMenuItem.menu as (Menu & { restaurant: Restaurant & { _id: Types.ObjectId } });

  // Nếu restaurant bị ẩn/deleted => populate ra null
  const restaurantIdRaw = populatedMenu.restaurant?._id;
  if (!restaurantIdRaw || !isValidObjectId(restaurantIdRaw))
    throw new BadRequestException('Nhà hàng không còn tồn tại');

  const restaurantId = new Types.ObjectId(String(restaurantIdRaw));
  const userObjectId = new Types.ObjectId(userId);

  // 2) Chuẩn hóa selectedOptions
  const selectedOptions: Types.ObjectId[] = (dto.selectedOptions ?? []).map(id => {
    if (!isValidObjectId(id)) throw new BadRequestException('Tuỳ chọn không hợp lệ');
    return new Types.ObjectId(id);
  });

  // 3) Validate options cũng phải check isDeleted/isActive (nếu schema có)
  if (selectedOptions.length > 0) {
    const validOptions = await this.menuItemOptionModel.find({
      _id: { $in: selectedOptions },
      menuItem: dto.menuItem,
      // isDeleted: false, isActive: true,
    }).select('_id');

    if (validOptions.length !== selectedOptions.length) {
      throw new NotFoundException('Một hoặc nhiều tuỳ chọn món ăn không hợp lệ');
    }
  }

  // 4) Tìm cart ACTIVE cho user + restaurant (NÊN có status: 'active')
  let cart = await this.cartModel.findOne({
    user: userObjectId,
    restaurant: restaurantId,
    status: 'active',
  });

  if (!cart) {
    cart = await this.cartModel.create({
      user: userObjectId,
      restaurant: restaurantId,
      status: 'active',
    });
  }

  // 5) Check item trùng
  const existingItemQuery: FilterQuery<CartItemDocument> = {
    cart: cart._id,
    menuItem: new Types.ObjectId(dto.menuItem),
  };

  if (selectedOptions.length > 0) {
    existingItemQuery.selectedOptions = { $size: selectedOptions.length, $all: selectedOptions };
  } else {
    existingItemQuery.$or = [
      { selectedOptions: { $exists: false } },
      { selectedOptions: { $size: 0 } },
    ];
  }

  const existingItem = await this.cartItemModel.findOne(existingItemQuery);

  if (existingItem) {
    existingItem.quantity += dto.quantity;
    await existingItem.save();

    return this.cartItemModel
      .findById(existingItem._id)
      .populate({
        path: 'menuItem',
        populate: { path: 'menu', populate: { path: 'restaurant', select: '_id name image' } },
      })
      .populate('selectedOptions')
      .lean();
  }

  const created = await this.cartItemModel.create({
    cart: cart._id,
    menuItem: dto.menuItem,
    quantity: dto.quantity,
    selectedOptions,
  });

  return this.cartItemModel
    .findById(created._id)
    .populate({
      path: 'menuItem',
      populate: { path: 'menu', populate: { path: 'restaurant', select: '_id name image' } },
    })
    .populate('selectedOptions')
    .lean();
}


  async update(itemId: string, dto: UpdateCartItemDto) {
    if (!itemId || itemId === 'undefined') throw new BadRequestException('Item ID không được để trống');
    if (!isValidObjectId(itemId)) throw new BadRequestException('Item ID không hợp lệ');

    const updated = await this.cartItemModel.findByIdAndUpdate(itemId, dto, { new: true });
    if (!updated) throw new NotFoundException('Không tìm thấy để cập nhật');
    return updated;
  }

  async remove(itemId: string) {
    if (!itemId || itemId === 'undefined') throw new BadRequestException('Item ID không được để trống');
    if (!isValidObjectId(itemId)) throw new BadRequestException('Item ID không hợp lệ');

    const deleted = await this.cartItemModel.findByIdAndDelete(itemId);
    if (!deleted) throw new NotFoundException('Không tìm thấy để xoá');
    return { message: 'Xoá thành công' };
  }
}

// src/modules/cart.items/cart.items.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { CartItem, CartItemDocument } from './schemas/cart.items.schema';
import { MenuItem } from '@/modules/menu.items/schemas/menu.item.schema';
import { MenuItemOption } from '@/modules/menu.item.options/schemas/menu.item.option.schema';
import { CreateCartItemDto } from './dto/create-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { Cart } from '../carts/schemas/carts.schema';

@Injectable()
export class CartItemsService {
  constructor(
    @InjectModel(CartItem.name)
    private readonly cartItemModel: Model<CartItemDocument>,

    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItem>,

    @InjectModel(MenuItemOption.name)
    private readonly menuItemOptionModel: Model<MenuItemOption>,

    @InjectModel(Cart.name)
    private readonly cartModel: Model<Cart>,
  ) {}

  async findAllByUser(userId: string) {
    if (!isValidObjectId(userId)) throw new BadRequestException('userId không hợp lệ');
    const userObjectId = new Types.ObjectId(userId);

    // 👇 Lấy tất cả cart (ví dụ chỉ trạng thái 'active' nếu bạn có field này)
    const carts = await this.cartModel.find({ user: userObjectId /*, status: 'active'*/ }).select('_id');
    if (!carts.length) return [];

    const cartIds = carts.map(c => c._id);

    const items = await this.cartItemModel
      .find({ cart: { $in: cartIds } })
      .populate({
        path: 'menuItem',
        populate: { path: 'menu', populate: { path: 'restaurant', select: '_id name image' } }
      })
      .populate('selectedOptions')
      .lean();

    return items;
  }

 async create(userId: string, dto: CreateCartItemDto) {
  if (!isValidObjectId(userId)) throw new BadRequestException('userId không hợp lệ');
  if (!isValidObjectId(dto.menuItem)) throw new NotFoundException('MenuItem ID không hợp lệ');

  // Lấy menuItem + menu + restaurant
  const newMenuItem = await this.menuItemModel
    .findById(dto.menuItem)
    .populate({
      path: 'menu',
      select: '_id restaurant',
      populate: { path: 'restaurant', select: '_id' },
    });

  if (!newMenuItem) throw new NotFoundException('Không tìm thấy MenuItem');

  // Rút ra restaurantId
  const restaurantIdRaw =
    (newMenuItem as any)?.menu?.restaurant?._id ??
    (newMenuItem as any)?.menu?.restaurant ??
    (newMenuItem as any)?.restaurant;

  if (!restaurantIdRaw || !isValidObjectId(restaurantIdRaw)) {
    throw new BadRequestException('Không xác định được nhà hàng của món ăn');
  }

  const restaurantId = new Types.ObjectId(String(restaurantIdRaw));
  const userObjectId = new Types.ObjectId(userId);

  // Chuẩn hóa selectedOptions
  const selectedOptions: Types.ObjectId[] = (dto.selectedOptions ?? []).map(id => {
    if (!isValidObjectId(id)) throw new BadRequestException('Tuỳ chọn không hợp lệ');
    return new Types.ObjectId(id);
  });

  // Validate selectedOptions (nếu có)
  if (selectedOptions.length > 0) {
    const validOptions = await this.menuItemOptionModel.find({
      _id: { $in: selectedOptions },
      menuItem: dto.menuItem,
    });
    if (validOptions.length !== selectedOptions.length) {
      throw new NotFoundException('Một hoặc nhiều tuỳ chọn món ăn không hợp lệ');
    }
  }

  // Tìm cart active cho user + restaurant
  let cart = await this.cartModel.findOne({
    user: userObjectId,
    restaurant: restaurantId,
    // status: 'active',
  });

  if (!cart) {
    cart = await this.cartModel.create({
      user: userObjectId,
      restaurant: restaurantId,
      // status: 'active',
    });
  }

  // Tìm item trùng trong cart
  // Nếu selectedOptions rỗng => check mảng rỗng luôn
const existingItemQuery: any = {
  cart: cart._id,
  menuItem: dto.menuItem
};

if (selectedOptions.length > 0) {
  existingItemQuery.selectedOptions = { $size: selectedOptions.length, $all: selectedOptions };
} else {
  existingItemQuery.$or = [
    { selectedOptions: { $exists: false } },
    { selectedOptions: { $size: 0 } }
  ];
}

const existingItem = await this.cartItemModel.findOne(existingItemQuery);


  if (existingItem) {
    // Cộng dồn số lượng
    existingItem.quantity += dto.quantity;
    await existingItem.save();

    // Populate để trả về đầy đủ thông tin
    return await this.cartItemModel
      .findById(existingItem._id)
      .populate({
        path: 'menuItem',
        populate: { path: 'menu', populate: { path: 'restaurant', select: '_id name image' } }
      })
      .populate('selectedOptions')
      .lean();
  }

  // Thêm mới nếu chưa có
  const created = await this.cartItemModel.create({
    cart: cart._id,
    menuItem: dto.menuItem,
    quantity: dto.quantity,
    selectedOptions,
  });

  return await this.cartItemModel
    .findById(created._id)
    .populate({
      path: 'menuItem',
      populate: { path: 'menu', populate: { path: 'restaurant', select: '_id name image' } }
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

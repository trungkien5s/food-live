import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Restaurant, RestaurantDocument } from './schemas/restaurant.schema';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { v2 as cloudinaryLib } from 'cloudinary';
import * as fs from 'fs';
import { NearbyDto } from './dto/nearby.dto';
import { Menu, MenuDocument } from '../menus/schemas/menu.schema';
import { MenuItem, MenuItemDocument } from '../menu.items/schemas/menu.item.schema';
import { Cart, CartDocument } from '../carts/schemas/carts.schema';
import { CartItem, CartItemDocument } from '../cart.items/schemas/cart.items.schema';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class RestaurantsService {
  constructor(
    @InjectModel(Restaurant.name)
    private restaurantModel: Model<RestaurantDocument>,
        @InjectModel(Menu.name)
    private menuModel: Model<MenuDocument>,

    @InjectModel(MenuItem.name)
    private menuItemModel: Model<MenuItemDocument>,

    @InjectModel(Cart.name)
    private cartModel: Model<CartDocument>,

    @InjectModel(CartItem.name)
    private cartItemModel: Model<CartItemDocument>,

    @Inject('CLOUDINARY')
    private cloudinary: typeof cloudinaryLib,
  ) {}

  async create(dto: CreateRestaurantDto, file?: Express.Multer.File) {
    const { phone, email } = dto;

    if (phone) {
      const phoneExists = await this.restaurantModel.findOne({ phone });
      if (phoneExists) {
        throw new BadRequestException('Số điện thoại đã được sử dụng');
      }
    }

    if (email) {
      const emailExists = await this.restaurantModel.findOne({ email });
      if (emailExists) {
        throw new BadRequestException('Email đã được sử dụng');
      }
    }

  let imageUrl: string | undefined;

  if (file) {
    const uploaded = await this.cloudinary.uploader.upload(file.path, {
      folder: 'restaurants',
    });
    imageUrl = uploaded.secure_url;
    fs.unlinkSync(file.path); 
  }

  const dataToSave = {
    ...dto,
    image: imageUrl,
  };

return this.restaurantModel.create(dataToSave);
  }

  async update(id: string, dto: UpdateRestaurantDto, file?: Express.Multer.File) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID nhà hàng không hợp lệ');
    }

  let imageUrl: string | undefined;

  if (file) {
    const uploaded = await this.cloudinary.uploader.upload(file.path, {
      folder: 'restaurants',
    });
    imageUrl = uploaded.secure_url;
    fs.unlinkSync(file.path); 
  }

  const dataToSave = {
    ...dto,
    image: imageUrl,
  };

    const updated = await this.restaurantModel.findByIdAndUpdate(id, dataToSave, {
      new: true,
    });

    if (!updated) {
      throw new NotFoundException('Không tìm thấy nhà hàng để cập nhật');
    }

    return updated;
  }

async findAll() {
  return this.restaurantModel.find({ isDeleted: false });
}

async findOne(id: string) {
  if (!isValidObjectId(id)) throw new BadRequestException('ID nhà hàng không hợp lệ');

  const restaurant = await this.restaurantModel.findOne({ _id: id, isDeleted: false });
  if (!restaurant) throw new NotFoundException('Không tìm thấy nhà hàng');
  return restaurant;
}

   async findNearbyWithDistance(dto: NearbyDto) {
    const { latitude, longitude, maxDistance } = dto;
    return this.restaurantModel.aggregate([
      {
        $geoNear: {
  near: { type: 'Point', coordinates: [longitude, latitude] },
  distanceField: 'dist.calculated',
  spherical: true,
  maxDistance,
  query: { isDeleted: false, isActive: true },
},

      },
      { $limit: 20 }, // giới hạn số kết quả, tuỳ chỉnh
      {
        $project: {
          name: 1,
          description: 1,
          phone: 1,
          email: 1,
          rating: 1,
          location: 1,
          dist: 1,
          image: 1,
        },
      },
    ]);
  }





    async remove(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID nhà hàng không hợp lệ');
    }

    const session = await this.restaurantModel.db.startSession();
    session.startTransaction();

    try {
      const restaurant = await this.restaurantModel.findOne({
        _id: id,
        isDeleted: false,
      }).session(session);

      if (!restaurant) {
        throw new NotFoundException('Không tìm thấy nhà hàng để xoá');
      }

      const now = new Date();

      // 4) Abandon all active carts of this restaurant
await this.cartModel.updateMany(
  { restaurant: new Types.ObjectId(id), status: 'active' },
  { $set: { status: 'abandoned' } },
  { session },
);

// 5) Delete cart items of those carts (optional but clean)
const carts = await this.cartModel
  .find({ restaurant: new Types.ObjectId(id) })
  .select('_id')
  .session(session);

await this.cartItemModel.deleteMany(
  { cart: { $in: carts.map(c => c._id) } },
  { session },
);

      // 1) Soft delete restaurant
      await this.restaurantModel.updateOne(
        { _id: restaurant._id },
        { $set: { isDeleted: true, isActive: false, deletedAt: now } },
        { session },
      );

      
      // 2) Soft delete menus thuộc restaurant
      await this.menuModel.updateMany(
        { restaurant: new Types.ObjectId(id) },
        { $set: { isDeleted: true, isActive: false, deletedAt: now } },
        { session },
      );

      // 3) Soft delete menu items thuộc restaurant
      await this.menuItemModel.updateMany(
        { restaurant: new Types.ObjectId(id) },
        { $set: { isDeleted: true, isActive: false, deletedAt: now } },
        { session },
      );

      await session.commitTransaction();
      session.endSession();

      return { message: 'Đã ẩn nhà hàng và toàn bộ menu/món ăn liên quan' };
    } catch (e) {
      await session.abortTransaction();
      session.endSession();
      throw e;
    }
  }
}


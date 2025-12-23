import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { MenuItem, MenuItemDocument } from './schemas/menu.item.schema';
import { CreateMenuItemDto } from './dto/create-menu.item.dto';
import { UpdateMenuItemDto } from './dto/update-menu.item.dto';
import { Menu, MenuDocument } from '../menus/schemas/menu.schema';
import { Category, CategoryDocument } from '../categories/schemas/category.schema';
import { v2 as cloudinaryLib, UploadApiResponse } from 'cloudinary';
import * as fs from 'fs/promises';
import { Restaurant, RestaurantDocument } from '../restaurants/schemas/restaurant.schema';

/**
 * Extended MenuItem type with Cloudinary image fields
 */
interface MenuItemWithImage extends MenuItem {
  imagePublicId?: string;
}

/**
 * Extended UpdateMenuItemDto with image fields that can be set by service
 */
interface UpdateMenuItemDtoWithImage extends UpdateMenuItemDto {
  imagePublicId?: string;
}

@Injectable()
export class MenuItemsService {
  constructor(
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItemDocument>,
    @InjectModel(Menu.name) private menuModel: Model<MenuDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Restaurant.name) private restaurantModel: Model<RestaurantDocument>,
    @Inject('CLOUDINARY') private cloudinary: typeof cloudinaryLib,
  ) { }

  /* ------------ Helpers ------------ */
  private ensureObjectId(id: string, name = 'ID') {
    if (!isValidObjectId(id)) throw new NotFoundException(`${name} không hợp lệ`);
  }

  private async uploadToCloudinary(file: Express.Multer.File, folder: string) {
    if (!file?.path) throw new BadRequestException('File upload không hợp lệ');
    try {
      const res: UploadApiResponse = await this.cloudinary.uploader.upload(file.path, { folder });
      return { url: res.secure_url, publicId: res.public_id };
    } finally {
      // dọn file tạm, không throw nếu lỗi xoá
      try { await fs.unlink(file.path); } catch { }
    }
  }

  private async deleteCloudinary(publicId?: string) {
    if (!publicId) return;
    try { await this.cloudinary.uploader.destroy(publicId); } catch { }
  }

  async create(dto: CreateMenuItemDto, file?: Express.Multer.File) {
    const { menu, categoryId, restaurant } = dto;

    // Validate menu
    this.ensureObjectId(menu, 'Menu ID');
    const menuExists = await this.menuModel.findById(menu).lean();
    if (!menuExists) throw new NotFoundException('Không tìm thấy menu');

    // Validate restaurant (bắt buộc theo schema)
    if (!restaurant) throw new BadRequestException('Thiếu restaurant');
    this.ensureObjectId(restaurant, 'Restaurant ID');
    const restaurantExists = await this.restaurantModel.findById(restaurant).lean();
    if (!restaurantExists) throw new NotFoundException('Không tìm thấy nhà hàng');

    // Validate category (nếu có)
    if (categoryId) {
      this.ensureObjectId(categoryId, 'Category ID');
      const categoryExists = await this.categoryModel.findById(categoryId).lean();
      if (!categoryExists) throw new NotFoundException('Không tìm thấy danh mục');
    }

    // Upload ảnh (nếu có)
    let imageUrl: string | undefined;
    let imagePublicId: string | undefined;
    if (file) {
      const up = await this.uploadToCloudinary(file, 'menu-items');
      imageUrl = up.url;
      imagePublicId = up.publicId;
    }

    const dataToSave = { ...dto, image: imageUrl, imagePublicId };
    const created = await this.menuItemModel.create(dataToSave);

    // 👉 Trả về bản ghi đã populate
    const populated = await this.menuItemModel
      .findById(created._id)
      .populate({ path: 'restaurant', select: '_id name slug address thumbnail avgRating isOpen' })
      .populate({ path: 'menu', select: '_id title' })
      .populate({ path: 'categoryId', select: '_id name' })
      .lean({ virtuals: true });   // bật virtuals nếu FE cần

    return populated;
  }

  // Hỗ trợ filter tuỳ ý từ controller (keyword, restaurant, category, v.v.)
  async findAll(filter: Record<string, unknown> = {}) {
    return this.menuItemModel
      .find(filter)
      .populate({ path: 'restaurant', select: '_id name slug address thumbnail avgRating isOpen' })
      .populate({ path: 'menu', select: '_id title' })
      .populate({ path: 'categoryId', select: '_id name' })
      .lean();
  }


  async findOne(id: string) {
    this.ensureObjectId(id);
    const item = await this.menuItemModel
      .findById(id)
      .populate({ path: 'restaurant', select: '_id name slug address thumbnail avgRating isOpen' })
      .populate({ path: 'menu', select: '_id title' })
      .populate({ path: 'categoryId', select: '_id name' });
    if (!item) throw new NotFoundException('Không tìm thấy menu item');
    return item;
  }

  async update(id: string, dto: UpdateMenuItemDto, file?: Express.Multer.File) {
    this.ensureObjectId(id);

    const current = await this.menuItemModel.findById(id) as MenuItemWithImage | null;
    if (!current) throw new NotFoundException('Không tìm thấy để cập nhật');

    // Nếu client đổi menu/category/restaurant thì validate lại
    if (dto.menu) {
      this.ensureObjectId(dto.menu, 'Menu ID');
      const menuOk = await this.menuModel.exists({ _id: dto.menu });
      if (!menuOk) throw new NotFoundException('Menu không tồn tại');
    }

    if (dto.restaurant) {
      this.ensureObjectId(dto.restaurant, 'Restaurant ID');
      const restOk = await this.restaurantModel.exists({ _id: dto.restaurant });
      if (!restOk) throw new NotFoundException('Nhà hàng không tồn tại');
    }

    if (dto.categoryId) {
      this.ensureObjectId(dto.categoryId, 'Category ID');
      const catOk = await this.categoryModel.exists({ _id: dto.categoryId });
      if (!catOk) throw new NotFoundException('Danh mục không tồn tại');
    }

    // Ảnh mới?
    const dtoWithImage = dto as UpdateMenuItemDtoWithImage;
    if (file) {
      const up = await this.uploadToCloudinary(file, 'menu-items');
      // xoá ảnh cũ nếu có
      await this.deleteCloudinary(current.imagePublicId);

      dtoWithImage.image = up.url;
      dtoWithImage.imagePublicId = up.publicId;
    }

    const updated = await this.menuItemModel.findByIdAndUpdate(id, dtoWithImage, { new: true });
    if (!updated) throw new NotFoundException('Không tìm thấy để cập nhật');
    return updated;
  }

  async remove(id: string) {
    this.ensureObjectId(id);
    const deleted = await this.menuItemModel.findByIdAndDelete(id) as MenuItemWithImage | null;
    if (!deleted) throw new NotFoundException('Không tìm thấy để xoá');

    // Xoá ảnh Cloudinary nếu có
    await this.deleteCloudinary(deleted.imagePublicId);

    return { message: 'Xoá thành công' };
  }
}

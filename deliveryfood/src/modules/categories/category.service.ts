// categories/categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MenuItem } from '@/modules/menu.items/schemas/menu.item.schema';
import { Menu } from '@/modules/menus/schemas/menu.schema';
import { Restaurant } from '@/modules/restaurants/schemas/restaurant.schema';

/**
 * Type for MenuItem when populated with menu and restaurant for category display
 */
export interface PopulatedCategoryMenuItem extends Omit<MenuItem, 'menu' | 'restaurant'> {
  menu: (Menu & { _id: Types.ObjectId }) | Types.ObjectId;
  restaurant: (Restaurant & { _id: Types.ObjectId }) | Types.ObjectId;
}

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItem>,
  ) { }

  async create(dto: CreateCategoryDto) {
    return this.categoryModel.create(dto);
  }

  async findAll() {
    return this.categoryModel.find().sort({ name: 1 });
  }

  async findOne(id: string) {
    if (!isValidObjectId(id)) throw new NotFoundException('Category not found');

    // First get the category
    const category = await this.categoryModel.findById(id).lean();
    if (!category) throw new NotFoundException('Category not found');

    // Then get all menu items for this category
    const menuItems = await this.menuItemModel
      .find({ categoryId: id })
      .populate({
        path: 'menu',
        select: '_id name title'
      })
      .populate({
        path: 'restaurant',
        select: '_id name address isOpen thumbnail avgRating'
      })
      .sort({ title: 1, name: 1 })
      .lean();

    // Group by menu
    const menusMap = new Map<string, { _id: Types.ObjectId; name: string; items: PopulatedCategoryMenuItem[] }>();

    for (const item of menuItems) {
      const typedItem = item as PopulatedCategoryMenuItem;
      const menu = typedItem.menu;

      // Type guard: check if menu is populated (not just ObjectId)
      if (!menu || typeof menu !== 'object' || !('_id' in menu)) continue;

      const populatedMenu = menu as Menu & { _id: Types.ObjectId };
      const key = String(populatedMenu._id);
      const menuName = populatedMenu.title ?? 'Menu';

      if (!menusMap.has(key)) {
        menusMap.set(key, {
          _id: populatedMenu._id,
          name: menuName,
          items: []
        });
      }

      menusMap.get(key)!.items.push(typedItem);
    }

    return {
      _id: category._id,
      name: category.name,
      slug: category.slug,
      menus: Array.from(menusMap.values()),
      menuItems: menuItems,
    };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const updated = await this.categoryModel.findByIdAndUpdate(id, dto, { new: true });
    if (!updated) throw new NotFoundException('Category not found');
    return updated;
  }

  async remove(id: string) {
    const result = await this.categoryModel.findByIdAndDelete(id);
    if (!result) throw new NotFoundException('Category not found');
    return result;
  }
}
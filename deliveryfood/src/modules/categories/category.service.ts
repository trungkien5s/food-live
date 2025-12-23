// categories/categories.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Category } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { MenuItem } from '@/modules/menu.items/schemas/menu.item.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>,
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItem>,
  ) {}

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
    const menusMap = new Map<string, { _id: any; name: string; items: any[] }>();
    
    for (const item of menuItems) {
      const menu = item.menu as any;
      if (!menu?._id) continue;
      
      const key = String(menu._id);
      const menuName = menu.name ?? menu.title ?? 'Menu';
      
      if (!menusMap.has(key)) {
        menusMap.set(key, { 
          _id: menu._id, 
          name: menuName, 
          items: [] 
        });
      }
      
      menusMap.get(key)!.items.push(item);
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
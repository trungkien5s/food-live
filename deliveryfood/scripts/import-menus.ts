import 'dotenv/config';
import mongoose, { Schema, Types } from 'mongoose';
import fs from 'fs';
import path from 'path';
import slugify from 'slugify';

/** ========== Helpers (VN normalize + search tokens) ========== */
const normalizeVN = (str = '') => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
};

const createSearchTokens = (text: string) => {
  const normalized = normalizeVN(text);
  if (!normalized) return [];
  // token theo từ + prefix (na ná elastic) để search gõ dần
  const words = normalized.split(' ').filter(Boolean);
  const prefixes: string[] = [];
  for (const w of words) {
    for (let i = 1; i <= Math.min(w.length, 20); i++) prefixes.push(w.slice(0, i));
  }
  return Array.from(new Set([...words, ...prefixes]));
};

const slugifyLower = (s: string) =>
  slugify(s, { lower: true, strict: true, locale: 'vi' });

/** ========== Mongoose Models (bám schema bạn đưa) ========== */
const RestaurantSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    description: String,
    phone: String,
    email: String,
    image: String,
    rating: { type: Number, min: 0, max: 5 },
    isOpen: { type: Boolean, default: true },
    address: String,
    openTime: String,
    closeTime: String,

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const MenuSchema = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    title: { type: String, required: true },
    image: String,

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, trim: true, lowercase: true, index: true },
  },
  { timestamps: true }
);

const MenuItemSchema = new Schema(
  {
    menu: { type: Schema.Types.ObjectId, ref: 'Menu', required: true, index: true },
    restaurant: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },

    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    searchKey: { type: String, index: true },
    searchTokens: { type: [String], index: true },

    basePrice: { type: Number, required: true, min: 0 },
    image: String,

    isActive: { type: Boolean, default: true, index: true },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

RestaurantSchema.index({ name: 1, isDeleted: 1 });
MenuSchema.index({ restaurant: 1, title: 1, isDeleted: 1 });
MenuItemSchema.index({ restaurant: 1, menu: 1, title: 1, isDeleted: 1 });

const RestaurantModel = mongoose.model('Restaurant', RestaurantSchema);
const MenuModel = mongoose.model('Menu', MenuSchema);
const CategoryModel = mongoose.model('Category', CategorySchema);
const MenuItemModel = mongoose.model('MenuItem', MenuItemSchema);

/** ========== Input types ========== */
type InputItem = {
  title: string;
  description?: string;
  price: number;
  image?: string;
  category?: string;
};

type InputMenu = {
  title: string;
  image?: string;
  items: InputItem[];
};

type InputRestaurantBlock = {
  restaurant: {
    name: string;
    address?: string;
    image?: string;
    rating?: number;
    isOpen?: boolean;
    description?: string;
    phone?: string;
    email?: string;
    openTime?: string;
    closeTime?: string;
  };
  menus: InputMenu[];
};

async function upsertCategory(categoryName?: string) {
  if (!categoryName) return null;

  const name = categoryName.trim();
  if (!name) return null;

  const slug = slugifyLower(name);
  const doc = await CategoryModel.findOneAndUpdate(
    { name },
    { $setOnInsert: { name, slug } },
    { upsert: true, new: true }
  );
  return doc;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI in .env');

  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');

  const filePath = path.resolve(process.argv[2] || 'data/grab_like.json');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data: InputRestaurantBlock[] = JSON.parse(raw);

  let restaurants = 0, menus = 0, items = 0, categories = 0;

  for (const block of data) {
    const r = block.restaurant;

    // Upsert Restaurant theo name + address (tuỳ bạn; mình dùng name + address để hạn chế trùng)
    const restaurantDoc = await RestaurantModel.findOneAndUpdate(
      { name: r.name.trim(), address: r.address ?? null, isDeleted: false },
      {
        $set: {
          description: r.description,
          phone: r.phone,
          email: r.email,
          image: r.image,
          rating: r.rating,
          isOpen: r.isOpen,
          openTime: r.openTime,
          closeTime: r.closeTime,
          isActive: true,
          isDeleted: false,
          deletedAt: null,
        },
      },
      { upsert: true, new: true }
    );

    restaurants++;

    for (const m of block.menus) {
      // Upsert Menu theo restaurant + title
      const menuDoc = await MenuModel.findOneAndUpdate(
        { restaurant: restaurantDoc._id, title: m.title.trim(), isDeleted: false },
        {
          $set: {
            image: m.image,
            isActive: true,
            isDeleted: false,
            deletedAt: null,
          },
        },
        { upsert: true, new: true }
      );
      menus++;

      for (const it of m.items) {
        const categoryDoc = await upsertCategory(it.category);
        if (categoryDoc) categories++;

        const searchKey = normalizeVN(it.title);
        const tokens = createSearchTokens(`${it.title} ${it.description ?? ''}`);

        // Upsert MenuItem theo restaurant + menu + title
        await MenuItemModel.findOneAndUpdate(
          {
            restaurant: restaurantDoc._id,
            menu: menuDoc._id,
            title: it.title.trim(),
            isDeleted: false,
          },
          {
            $set: {
              description: it.description,
              basePrice: it.price,
              image: it.image,
              categoryId: categoryDoc?._id ?? undefined,
              searchKey,
              searchTokens: tokens,
              isActive: true,
              isDeleted: false,
              deletedAt: null,
            },
          },
          { upsert: true, new: true }
        );

        items++;
      }
    }
  }

  console.log(`✅ Done.
Restaurants: ${restaurants}
Menus: ${menus}
MenuItems: ${items}
(Upsert Category calls): ${categories}`);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error('❌ Import failed:', e);
  process.exit(1);
});

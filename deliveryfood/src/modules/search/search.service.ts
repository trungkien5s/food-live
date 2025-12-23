import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Restaurant } from '@/modules/restaurants/schemas/restaurant.schema';
import { MenuItem } from '@/modules/menu.items/schemas/menu.item.schema';
import { SearchQueryDto } from './dto/search.dto';

// Advanced Vietnamese text processing
const normalizeVN = (str = '') => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
};

// Create searchable tokens (like Elasticsearch)
const createSearchTokens = (text: string) => {
  if (!text) return [];
  const normalized = normalizeVN(text);
  const words = normalized.split(/\s+/).filter(w => w.length > 0);
  const tokens = new Set<string>();
  
  // Add full words
  words.forEach(word => {
    tokens.add(word);
    // Add partial matches (prefixes)
    for (let i = 1; i <= word.length; i++) {
      tokens.add(word.substring(0, i));
    }
  });
  
  // Add bigrams for better phrase matching
  for (let i = 0; i < words.length - 1; i++) {
    tokens.add(`${words[i]} ${words[i + 1]}`);
  }
  
  return Array.from(tokens);
};

// Levenshtein distance for fuzzy matching
const levenshteinDistance = (a: string, b: string): number => {
  const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
  
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,     // deletion
        matrix[i][j - 1] + 1,     // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[a.length][b.length];
};

@Injectable()
export class SearchService {
  constructor(
    @InjectModel(Restaurant.name) private restaurantModel: Model<Restaurant>,
    @InjectModel(MenuItem.name) private menuItemModel: Model<MenuItem>,
  ) {}

  async search(params: SearchQueryDto) {
    const {
      q, type = 'all', categoryId, city, isOpen,
      minPrice, maxPrice, sort = 'relevance',
      page = 1, limit = 20, lat, lng,
    } = params;

    if (!q?.trim()) {
      return this.searchWithoutQuery(params);
    }

    const keyword = normalizeVN(q.trim());
    const searchTokens = createSearchTokens(q);
    const skip = Math.max(0, (page - 1) * limit);

    console.log('Search analysis:', {
      original: q,
      normalized: keyword,
      tokens: searchTokens.slice(0, 10), // First 10 tokens
      type, page, limit
    });

    // Build advanced search pipeline
    const results = await this.executeAdvancedSearch({
      keyword,
      searchTokens,
      originalQuery: q,
      type,
      categoryId,
      city,
      isOpen,
      minPrice,
      maxPrice,
      sort,
      skip,
      limit,
      lat,
      lng
    });

    return {
      keyword: q,
      page,
      limit,
      totals: results.totals,
      results: results.data,
      suggestions: await this.getSuggestions(q, results.totals),
      debug: {
        searchTokens: searchTokens.slice(0, 5),
        searchStrategy: results.strategy
      }
    };
  }

  private async executeAdvancedSearch(params: any) {
    const {
      keyword, searchTokens, originalQuery, type,
      categoryId, city, isOpen, minPrice, maxPrice,
      sort, skip, limit, lat, lng
    } = params;

    // Strategy 1: Exact and prefix matching (fastest)
    let restaurants = [], menuItems = [], totalRestaurants = 0, totalMenuItems = 0;
    let strategy = 'exact';

    if (type !== 'menu-items') {
      const exactResults = await this.searchRestaurantsExact(keyword, searchTokens, {
        city, isOpen, sort, skip, limit, lat, lng
      });
      restaurants = exactResults.data;
      totalRestaurants = exactResults.total;
    }

    if (type !== 'restaurants') {
      const exactResults = await this.searchMenuItemsExact(keyword, searchTokens, {
        categoryId, city, isOpen, minPrice, maxPrice, sort, skip, limit, lat, lng
      });
      menuItems = exactResults.data;
      totalMenuItems = exactResults.total;
    }

    // Strategy 2: If no exact results, try fuzzy search
    if (totalRestaurants === 0 && totalMenuItems === 0 && keyword.length >= 3) {
      strategy = 'fuzzy';
      
      if (type !== 'menu-items') {
        const fuzzyResults = await this.searchRestaurantsFuzzy(keyword, {
          city, isOpen, sort, skip, limit, lat, lng
        });
        restaurants = fuzzyResults.data;
        totalRestaurants = fuzzyResults.total;
      }

      if (type !== 'restaurants') {
        const fuzzyResults = await this.searchMenuItemsFuzzy(keyword, {
          categoryId, city, isOpen, minPrice, maxPrice, sort, skip, limit, lat, lng
        });
        menuItems = fuzzyResults.data;
        totalMenuItems = fuzzyResults.total;
      }
    }

    // Strategy 3: Partial word matching (fallback)
    if (totalRestaurants === 0 && totalMenuItems === 0) {
      strategy = 'partial';
      
      if (type !== 'menu-items') {
        const partialResults = await this.searchRestaurantsPartial(keyword, {
          city, isOpen, sort, skip, limit, lat, lng
        });
        restaurants = partialResults.data;
        totalRestaurants = partialResults.total;
      }

      if (type !== 'restaurants') {
        const partialResults = await this.searchMenuItemsPartial(keyword, {
          categoryId, city, isOpen, minPrice, maxPrice, sort, skip, limit, lat, lng
        });
        menuItems = partialResults.data;
        totalMenuItems = partialResults.total;
      }
    }

    return {
      data: { restaurants, menuItems },
      totals: { restaurants: totalRestaurants, menuItems: totalMenuItems },
      strategy
    };
  }

  // Exact/Prefix search for restaurants
private async searchRestaurantsExact(keyword: string, tokens: string[], filters: any) {
  // 1) Kiểm tra text index
  let hasTextIndex = false;
  try {
    const indexes = await this.restaurantModel.collection.listIndexes().toArray();
    hasTextIndex = indexes.some(idx => idx.weights && (idx as any).name === 'restaurant_text_index');
  } catch {}

  // 2) Build các nhánh non-text (KHÔNG chứa $text)
  const orClauses: any[] = [
    { name: new RegExp(`^${this.escapeRegex(keyword)}`, 'i') },
    { searchKey: new RegExp(`^${this.escapeRegex(keyword)}`, 'i') },
    ...(tokens.length > 0 ? [{ searchTokens: { $in: tokens.slice(0, 10) } }] : []),
    { name: new RegExp(this.escapeRegex(keyword), 'i') },
    { description: new RegExp(this.escapeRegex(keyword), 'i') },
  ];

  // Áp lọc cấp cao (city/isOpen) vào matchStage sau
  const nonTextMatch: any = { $or: orClauses };
  this.applyRestaurantFilters(nonTextMatch, filters);

  // 3) Nếu có text index → chạy TEXT-ONLY trước (KHÔNG $or)
  if (hasTextIndex && keyword.length >= 2) {
    const textMatch: any = { $text: { $search: `"${keyword}"` } };
    this.applyRestaurantFilters(textMatch, filters);

    const textPipeline: PipelineStage[] = [
      { $match: textMatch },
      {
        $addFields: {
          relevanceScore: {
            $add: [
              { $ifNull: [{ $meta: 'textScore' }, 0] },
              { $multiply: ['$rating', 5] },
            ],
          },
        },
      },
    ];
    this.applySorting(textPipeline, filters.sort, 'restaurant');
    this.applyGeoNear(textPipeline, filters.lat, filters.lng, 'restaurant');

    const [data, total] = await Promise.all([
      this.restaurantModel.aggregate([
        ...textPipeline,
        { $skip: filters.skip },
        { $limit: filters.limit },
        { $project: { relevanceScore: 0, searchTokens: 0 } },
      ]).exec(),
      this.restaurantModel.countDocuments(textMatch).exec(),
    ]);

    // Nếu có kết quả từ text search thì trả luôn (đã tránh lỗi)
    if (total > 0) return { data, total };
    // Nếu không có → rơi xuống non-text
  }

  // 4) Non-text pipeline (regex/tokens)
  const pipeline: PipelineStage[] = [
    { $match: nonTextMatch },
    {
      $addFields: {
        relevanceScore: {
          $add: [
            { $cond: { if: { $eq: [{ $toLower: '$name' }, keyword] }, then: 100, else: 0 } },
            { $cond: { if: { $regexMatch: { input: { $toLower: '$name' }, regex: `^${this.escapeRegex(keyword)}` } }, then: 50, else: 0 } },
            { $cond: { if: { $regexMatch: { input: { $toLower: '$name' }, regex: this.escapeRegex(keyword) } }, then: 25, else: 0 } },
            { $multiply: ['$rating', 5] },
          ],
        },
      },
    },
  ];
  this.applySorting(pipeline, filters.sort, 'restaurant');
  this.applyGeoNear(pipeline, filters.lat, filters.lng, 'restaurant');

  const [data, total] = await Promise.all([
    this.restaurantModel.aggregate([
      ...pipeline,
      { $skip: filters.skip },
      { $limit: filters.limit },
      { $project: { relevanceScore: 0, searchTokens: 0 } },
    ]).exec(),
    this.restaurantModel.countDocuments(nonTextMatch).exec(),
  ]);

  return { data, total };
}


  // Exact/Prefix search for menu items
private async searchMenuItemsExact(keyword: string, tokens: string[], filters: any) {
  let hasTextIndex = false;
  try {
    const indexes = await this.menuItemModel.collection.listIndexes().toArray();
    hasTextIndex = indexes.some(idx => idx.weights && (idx as any).name === 'menuitem_text_index');
  } catch {}

  const orClauses: any[] = [
    { title: new RegExp(`^${this.escapeRegex(keyword)}`, 'i') },
    { searchKey: new RegExp(`^${this.escapeRegex(keyword)}`, 'i') },
    ...(tokens.length > 0 ? [{ searchTokens: { $in: tokens.slice(0, 10) } }] : []),
    { title: new RegExp(this.escapeRegex(keyword), 'i') },
    { description: new RegExp(this.escapeRegex(keyword), 'i') },
  ];

  const nonTextMatch: any = { $or: orClauses };
  this.applyMenuItemFilters(nonTextMatch, filters);

  // TEXT-ONLY trước
  if (hasTextIndex && keyword.length >= 2) {
    const textMatch: any = { $text: { $search: `"${keyword}"` } };
    this.applyMenuItemFilters(textMatch, filters);

    const textPipeline: PipelineStage[] = [
      { $match: textMatch },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurant',
          foreignField: '_id',
          as: 'restaurant',
        },
      },
      { $unwind: '$restaurant' },
      ...(filters.city ? [{ $match: { 'restaurant.city': filters.city } }] : []),
      ...(filters.isOpen !== undefined ? [{ $match: { 'restaurant.isOpen': filters.isOpen === 'true' } }] : []),
      {
        $addFields: {
          relevanceScore: {
            $add: [
              { $ifNull: [{ $meta: 'textScore' }, 0] },
              { $multiply: ['$restaurant.rating', 3] },
            ],
          },
        },
      },
    ];
    this.applySorting(textPipeline, filters.sort, 'menuItem');

    const [data, total] = await Promise.all([
      this.menuItemModel.aggregate([
        ...textPipeline,
        { $skip: filters.skip },
        { $limit: filters.limit },
        { $project: { relevanceScore: 0, searchTokens: 0 } },
      ]).exec(),
      this.menuItemModel.countDocuments(textMatch).exec(),
    ]);

    if (total > 0) return { data, total };
  }

  // NON-TEXT (regex/tokens)
  const pipeline: PipelineStage[] = [
    { $match: nonTextMatch },
    {
      $lookup: {
        from: 'restaurants',
        localField: 'restaurant',
        foreignField: '_id',
        as: 'restaurant',
      },
    },
    { $unwind: '$restaurant' },
    ...(filters.city ? [{ $match: { 'restaurant.city': filters.city } }] : []),
    ...(filters.isOpen !== undefined ? [{ $match: { 'restaurant.isOpen': filters.isOpen === 'true' } }] : []),
    {
      $addFields: {
        relevanceScore: {
          $add: [
            { $cond: { if: { $eq: [{ $toLower: '$title' }, keyword] }, then: 100, else: 0 } },
            { $cond: { if: { $regexMatch: { input: { $toLower: '$title' }, regex: `^${this.escapeRegex(keyword)}` } }, then: 50, else: 0 } },
            { $cond: { if: { $regexMatch: { input: { $toLower: '$title' }, regex: this.escapeRegex(keyword) } }, then: 25, else: 0 } },
            { $multiply: ['$restaurant.rating', 3] },
          ],
        },
      },
    },
  ];
  this.applySorting(pipeline, filters.sort, 'menuItem');

  const [data, total] = await Promise.all([
    this.menuItemModel.aggregate([
      ...pipeline,
      { $skip: filters.skip },
      { $limit: filters.limit },
      { $project: { relevanceScore: 0, searchTokens: 0 } },
    ]).exec(),
    this.menuItemModel.countDocuments(nonTextMatch).exec(),
  ]);

  return { data, total };
}


  // Fuzzy search implementations
  private async searchRestaurantsFuzzy(keyword: string, filters: any) {
    // Implementation for fuzzy restaurant search
    const pipeline: PipelineStage[] = [
      {
        $match: {
          $or: [
            { name: new RegExp(this.createFuzzyRegex(keyword), 'i') },
            { searchKey: new RegExp(this.createFuzzyRegex(keyword), 'i') }
          ]
        }
      },
      {
        $addFields: {
          fuzzyScore: {
            $function: {
              body: `function(name, keyword) {
                const distance = this.levenshteinDistance || function(a, b) {
                  const matrix = [];
                  for (let i = 0; i <= a.length; i++) {
                    matrix[i] = [i];
                  }
                  for (let j = 0; j <= b.length; j++) {
                    matrix[0][j] = j;
                  }
                  for (let i = 1; i <= a.length; i++) {
                    for (let j = 1; j <= b.length; j++) {
                      const cost = a[i-1] === b[j-1] ? 0 : 1;
                      matrix[i][j] = Math.min(
                        matrix[i-1][j] + 1,
                        matrix[i][j-1] + 1,
                        matrix[i-1][j-1] + cost
                      );
                    }
                  }
                  return matrix[a.length][b.length];
                };
                
                const d = distance(name.toLowerCase(), keyword.toLowerCase());
                return Math.max(0, 100 - d * 10);
              }`,
              args: ['$name', keyword],
              lang: 'js'
            }
          }
        }
      },
      { $match: { fuzzyScore: { $gte: 50 } } }
    ];

    this.applySorting(pipeline, filters.sort, 'restaurant');

    const [data, total] = await Promise.all([
      this.restaurantModel.aggregate([
        ...pipeline,
        { $skip: filters.skip },
        { $limit: filters.limit },
        { $project: { fuzzyScore: 0 } }
      ]).exec(),
      this.restaurantModel.aggregate([...pipeline, { $count: 'total' }]).exec().then(r => r[0]?.total || 0)
    ]);

    return { data, total };
  }

  private async searchMenuItemsFuzzy(keyword: string, filters: any) {
    // Similar implementation for menu items
    const pipeline: PipelineStage[] = [
      {
        $match: {
          $or: [
            { title: new RegExp(this.createFuzzyRegex(keyword), 'i') },
            { searchKey: new RegExp(this.createFuzzyRegex(keyword), 'i') }
          ]
        }
      },
      {
        $lookup: {
          from: 'restaurants',
          localField: 'restaurant',
          foreignField: '_id',
          as: 'restaurant'
        }
      },
      { $unwind: '$restaurant' }
    ];

    const [data, total] = await Promise.all([
      this.menuItemModel.aggregate([
        ...pipeline,
        { $skip: filters.skip },
        { $limit: filters.limit }
      ]).exec(),
      this.menuItemModel.aggregate([...pipeline, { $count: 'total' }]).exec().then(r => r[0]?.total || 0)
    ]);

    return { data, total };
  }

  // Partial matching (last resort)
  private async searchRestaurantsPartial(keyword: string, filters: any) {
    const words = keyword.split(' ').filter(w => w.length >= 2);
    const regexPattern = words.map(w => `(?=.*${this.escapeRegex(w)})`).join('');
    
    const matchStage: any = {
      $or: [
        { name: new RegExp(regexPattern, 'i') },
        { searchKey: new RegExp(regexPattern, 'i') }
      ]
    };

    const [data, total] = await Promise.all([
      this.restaurantModel.find(matchStage)
        .skip(filters.skip)
        .limit(filters.limit)
        .exec(),
      this.restaurantModel.countDocuments(matchStage).exec()
    ]);

    return { data, total };
  }

  private async searchMenuItemsPartial(keyword: string, filters: any) {
    const words = keyword.split(' ').filter(w => w.length >= 2);
    const regexPattern = words.map(w => `(?=.*${this.escapeRegex(w)})`).join('');
    
    const [data, total] = await Promise.all([
      this.menuItemModel.aggregate([
        { $match: { 
          $or: [
            { title: new RegExp(regexPattern, 'i') },
            { searchKey: new RegExp(regexPattern, 'i') }
          ]
        }},
        {
          $lookup: {
            from: 'restaurants',
            localField: 'restaurant',
            foreignField: '_id',
            as: 'restaurant'
          }
        },
        { $unwind: '$restaurant' },
        { $skip: filters.skip },
        { $limit: filters.limit }
      ]).exec(),
      this.menuItemModel.countDocuments({
        $or: [
          { title: new RegExp(regexPattern, 'i') },
          { searchKey: new RegExp(regexPattern, 'i') }
        ]
      }).exec()
    ]);

    return { data, total };
  }

  // Search without query (trending, popular, etc.)
  private async searchWithoutQuery(params: SearchQueryDto) {
    const { type = 'all', page = 1, limit = 20 } = params;
    const skip = Math.max(0, (page - 1) * limit);

    const [restaurants, totalRestaurants, menuItems, totalMenuItems] = await Promise.all([
      type !== 'menu-items' ? 
        this.restaurantModel
          .find({ isOpen: true })
          .sort({ rating: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec() : [],
      type !== 'menu-items' ? 
        this.restaurantModel.countDocuments({ isOpen: true }).exec() : 0,
      type !== 'restaurants' ?
        this.menuItemModel.aggregate([
          {
            $lookup: {
              from: 'restaurants',
              localField: 'restaurant',
              foreignField: '_id',
              as: 'restaurant'
            }
          },
          { $unwind: '$restaurant' },
          { $match: { 'restaurant.isOpen': true } },
          { $sort: { 'restaurant.rating': -1, basePrice: 1 } },
          { $skip: skip },
          { $limit: limit }
        ]).exec() : [],
      type !== 'restaurants' ?
        this.menuItemModel.aggregate([
          {
            $lookup: {
              from: 'restaurants',
              localField: 'restaurant',
              foreignField: '_id',
              as: 'restaurant'
            }
          },
          { $unwind: '$restaurant' },
          { $match: { 'restaurant.isOpen': true } },
          { $count: 'total' }
        ]).exec().then(r => r[0]?.total || 0) : 0
    ]);

    return {
      keyword: '',
      page,
      limit,
      totals: { restaurants: totalRestaurants, menuItems: totalMenuItems },
      results: { restaurants, menuItems },
      suggestions: []
    };
  }

  // Get search suggestions
  private async getSuggestions(query: string, totals: any) {
    if (!query || query.length < 2) return [];
    
    const keyword = normalizeVN(query);
    const suggestions = [];

    // Restaurant name suggestions
    const restaurantSuggestions = await this.restaurantModel
      .find({
        name: new RegExp(`^${this.escapeRegex(keyword)}`, 'i')
      })
      .select('name')
      .limit(5)
      .exec();

    suggestions.push(...restaurantSuggestions.map(r => ({
      text: r.name,
      type: 'restaurant'
    })));

    // Menu item suggestions
    const menuItemSuggestions = await this.menuItemModel
      .find({
        title: new RegExp(`^${this.escapeRegex(keyword)}`, 'i')
      })
      .select('title')
      .limit(5)
      .exec();

    suggestions.push(...menuItemSuggestions.map(m => ({
      text: m.title,
      type: 'menu-item'
    })));

    return suggestions.slice(0, 8);
  }

  // Helper methods
  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private createFuzzyRegex(keyword: string): string {
    return keyword.split('').join('.*?');
  }

  private applyRestaurantFilters(matchStage: any, filters: any) {
    if (filters.city) matchStage.city = filters.city;
    if (filters.isOpen !== undefined) matchStage.isOpen = filters.isOpen === 'true';
  }

  private applyMenuItemFilters(matchStage: any, filters: any) {
    if (filters.categoryId) matchStage.categoryId = new Types.ObjectId(filters.categoryId);
    if (filters.minPrice) {
      matchStage.basePrice = { ...(matchStage.basePrice || {}), $gte: Number(filters.minPrice) };
    }
    if (filters.maxPrice) {
      matchStage.basePrice = { ...(matchStage.basePrice || {}), $lte: Number(filters.maxPrice) };
    }
  }

  private applySorting(pipeline: PipelineStage[], sort: string, entityType: 'restaurant' | 'menuItem') {
    const sortStage: any = {};
    
    switch (sort) {
      case 'rating':
        sortStage[entityType === 'restaurant' ? 'rating' : 'restaurant.rating'] = -1;
        break;
      case 'price_asc':
        if (entityType === 'menuItem') sortStage.basePrice = 1;
        break;
      case 'price_desc':
        if (entityType === 'menuItem') sortStage.basePrice = -1;
        break;
      case 'relevance':
      default:
        sortStage.relevanceScore = -1;
        sortStage[entityType === 'restaurant' ? 'rating' : 'restaurant.rating'] = -1;
        break;
    }
    
    if (Object.keys(sortStage).length > 0) {
      pipeline.push({ $sort: sortStage });
    }
  }

  private applyGeoNear(pipeline: PipelineStage[], lat?: string, lng?: string, entityType?: string) {
    if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      if (entityType === 'restaurant') {
        pipeline.unshift({
          $geoNear: {
            near: { type: 'Point', coordinates: [Number(lng), Number(lat)] },
            distanceField: 'distance',
            spherical: true,
            key: 'location'
          }
        } as any);
      }
    }
  }

  // Setup search indexes (run this once)
  async setupSearchIndexes() {
    try {
      // Text indexes
      await this.restaurantModel.collection.createIndex({
        name: 'text',
        description: 'text',
        searchKey: 'text'
      }, { 
        weights: { name: 10, searchKey: 5, description: 1 },
        name: 'restaurant_text_index'
      });

      await this.menuItemModel.collection.createIndex({
        title: 'text',
        description: 'text',
        searchKey: 'text'
      }, {
        weights: { title: 10, searchKey: 5, description: 1 },
        name: 'menuitem_text_index'
      });

      // Other useful indexes
      await this.restaurantModel.collection.createIndex({ searchTokens: 1 });
      await this.menuItemModel.collection.createIndex({ searchTokens: 1 });
      await this.restaurantModel.collection.createIndex({ name: 1 });
      await this.menuItemModel.collection.createIndex({ title: 1 });
      await this.restaurantModel.collection.createIndex({ rating: -1 });
      await this.menuItemModel.collection.createIndex({ basePrice: 1 });
      
      // Geo index if using location
      await this.restaurantModel.collection.createIndex({ location: '2dsphere' });

      console.log('Search indexes created successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error creating indexes:', error);
      throw error;
    }
  }

  // Rebuild search data (run when adding new restaurants/menu items)
  async rebuildSearchData() {
    console.log('Rebuilding search data...');
    
    // Update restaurants
    const restaurants = await this.restaurantModel.find().select('name description').exec();
    for (const restaurant of restaurants) {
      const searchKey = normalizeVN(`${restaurant.name} ${restaurant.description || ''}`);
      const searchTokens = createSearchTokens(`${restaurant.name} ${restaurant.description || ''}`);
      
      await this.restaurantModel.updateOne(
        { _id: restaurant._id },
        { $set: { searchKey, searchTokens } }
      );
    }
    
    // Update menu items
    const menuItems = await this.menuItemModel.find().select('title description').exec();
    for (const menuItem of menuItems) {
      const searchKey = normalizeVN(`${menuItem.title} ${menuItem.description || ''}`);
      const searchTokens = createSearchTokens(`${menuItem.title} ${menuItem.description || ''}`);
      
      await this.menuItemModel.updateOne(
        { _id: menuItem._id },
        { $set: { searchKey, searchTokens } }
      );
    }
    
    console.log(`Updated ${restaurants.length} restaurants and ${menuItems.length} menu items`);
    return { 
      success: true, 
      restaurantsUpdated: restaurants.length, 
      menuItemsUpdated: menuItems.length 
    };
  }
}
import { FilterQuery } from 'mongoose';
import { Restaurant } from '@/modules/restaurants/schemas/restaurant.schema';
import { MenuItem } from '@/modules/menu.items/schemas/menu.item.schema';

export interface SearchFilters {
    city?: string;
    isOpen?: boolean | string;
    categoryId?: string;
    minPrice?: number | string;
    maxPrice?: number | string;
    sort?: string;
    skip?: number;
    limit?: number;
    lat?: string | number;
    lng?: string | number;
}

export interface SearchExecutionParams extends SearchFilters {
    keyword: string;
    searchTokens: string[];
    originalQuery: string;
    type?: string;
}

export interface SearchResults {
    restaurants: Restaurant[];
    menuItems: MenuItem[];
}

export interface SearchTotals {
    restaurants: number;
    menuItems: number;
}

export interface AdvancedSearchResult {
    data: SearchResults;
    totals: SearchTotals;
    strategy: 'exact' | 'fuzzy' | 'partial';
}

export interface SearchMethodResult<T> {
    data: T[];
    total: number;
}

// MongoDB query types
export type RestaurantFilterQuery = FilterQuery<Restaurant>;
export type MenuItemFilterQuery = FilterQuery<MenuItem>;

// MongoDB match stage types
export interface MongoMatchStage {
    [key: string]: unknown;
    $or?: Array<Record<string, unknown>>;
    $and?: Array<Record<string, unknown>>;
    $text?: {
        $search: string;
        $language?: string;
        $caseSensitive?: boolean;
        $diacriticSensitive?: boolean;
    };
}

// MongoDB sort stage type
export type MongoSortStage = Record<string, 1 | -1>;

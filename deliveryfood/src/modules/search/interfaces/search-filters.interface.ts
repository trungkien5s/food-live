export interface SearchFiltersData {
    city?: string;
    categoryIds?: string[];
    priceRange?: {
        min?: number;
        max?: number;
    };
    isOpen?: boolean;
    rating?: number;
    distance?: number;
    [key: string]: unknown;
}

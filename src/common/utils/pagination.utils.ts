export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export class PaginationUtils {
  static validateAndNormalizePaginationParams(params: PaginationParams): PaginationOptions {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 10)); // Max 100 items per page
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  static buildPaginationMeta(
    currentPage: number,
    itemsPerPage: number,
    totalItems: number
  ): PaginationMeta {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return {
      currentPage,
      itemsPerPage,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    };
  }

  static buildPaginatedResponse<T>(
    data: T[],
    currentPage: number,
    itemsPerPage: number,
    totalItems: number
  ): PaginatedResponse<T> {
    const meta = this.buildPaginationMeta(currentPage, itemsPerPage, totalItems);
    
    return {
      data,
      meta
    };
  }
}

// Search utilities
export interface SearchableField {
  field: string;
  type: 'string' | 'relation';
  relationField?: string;
}

export class SearchUtils {
  static buildSearchCondition(
    searchTerm: string,
    searchableFields: SearchableField[]
  ): any {
    if (!searchTerm) return {};

    const conditions = searchableFields.map(({ field, type, relationField }) => {
      if (type === 'string') {
        return {
          [field]: {
            contains: searchTerm,
            mode: 'insensitive'
          }
        };
      }
      
      if (type === 'relation' && relationField) {
        return {
          [field]: {
            some: {
              [relationField]: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          }
        };
      }
      
      return {};
    }).filter(condition => Object.keys(condition).length > 0);

    return conditions.length > 0 ? { OR: conditions } : {};
  }
}

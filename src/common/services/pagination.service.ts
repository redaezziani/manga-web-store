import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { 
  PaginationParams, 
  PaginatedResponse, 
  PaginationUtils,
  SearchUtils,
  SearchableField 
} from '../utils/pagination.utils';

@Injectable()
export abstract class PaginationService {
  constructor(protected readonly prisma: PrismaService) {}

  protected async paginate<T>(
    model: any,
    params: PaginationParams,
    searchableFields: SearchableField[] = [],
    include?: any,
    orderBy?: any
  ): Promise<PaginatedResponse<T>> {
    const { page, limit, skip } = PaginationUtils.validateAndNormalizePaginationParams(params);
    
    // Build search conditions
    const searchCondition = SearchUtils.buildSearchCondition(params.search || '', searchableFields);
    
    // Build order by conditions
    const defaultOrderBy: any = { createdAt: 'desc' };
    let finalOrderBy: any = defaultOrderBy;
    
    if (params.sortBy) {
      finalOrderBy = {
        [params.sortBy]: params.sortOrder || 'desc'
      };
    }
    
    // Merge with custom orderBy if provided
    if (orderBy) {
      finalOrderBy = { ...finalOrderBy, ...orderBy };
    }

    // Build query options
    const queryOptions: any = {
      where: searchCondition,
      orderBy: finalOrderBy,
      skip,
      take: limit
    };

    if (include) {
      queryOptions.include = include;
    }

    // Execute queries in parallel
    const [data, totalItems] = await Promise.all([
      model.findMany(queryOptions),
      model.count({ where: searchCondition })
    ]);

    return PaginationUtils.buildPaginatedResponse(data, page, limit, totalItems);
  }
}

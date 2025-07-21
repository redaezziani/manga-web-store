import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateMangaDto } from './dto/create-manga.dto';
import { Manga } from '@prisma/client';
import { PaginationService } from '../common/services/pagination.service';
import { PaginationParams, PaginatedResponse, SearchableField } from '../common/utils/pagination.utils';

@Injectable()
export class MangaService extends PaginationService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async create(createMangaDto: CreateMangaDto): Promise<Manga> {
    try {
      
      const { categoryIds, ...mangaData } = createMangaDto;

      const manga = await this.prisma.manga.create({
        data: {
          ...mangaData,
          ...(categoryIds && categoryIds.length > 0 && {
            categories: {
              connect: categoryIds.map(id => ({ id }))
            }
          })
        },
        include: {
          categories: true,
          volumes: true
        }
      });

      console.log('Manga created successfully:', manga);
      return manga;
    } catch (error) {
      
      if (error.code === 'P2025') {
        throw new NotFoundException('One or more categories not found');
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Manga with this title already exists');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException('Invalid category reference');
      }
      
      throw new BadRequestException(`Failed to create manga: ${error.message}`);
    }
  }

  async findAll(params: PaginationParams = {}): Promise<PaginatedResponse<Manga>> {
    const searchableFields: SearchableField[] = [
      { field: 'title', type: 'string' },
      { field: 'author', type: 'string' },
      { field: 'description', type: 'string' },
      { field: 'categories', type: 'relation', relationField: 'name' },
      { field: 'categories', type: 'relation', relationField: 'nameAr' }
    ];

    const include = {
      categories: true,
      volumes: {
        select: {
          id: true,
          volumeNumber: true,
          price: true,
          discount: true,
          stock: true,
          isAvailable: true
        }
      }
    };

    return this.paginate<Manga>(
      this.prisma.manga,
      params,
      searchableFields,
      include
    );
  }

  async findOne(id: string): Promise<Manga> {
    const manga = await this.prisma.manga.findUnique({
      where: { id },
      include: {
        categories: true,
        volumes: {
          include: {
            previewImages: true
          }
        }
      }
    });

    if (!manga) {
      throw new NotFoundException(`Manga with ID ${id} not found`);
    }

    return manga;
  }

  async getMangaCount(): Promise<number> {
    return this.prisma.manga.count();
  }

  async getAllCategories() {
    return this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        nameAr: true,
        slug: true,
        description: true,
        _count: {
          select: {
            mangas: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }
}

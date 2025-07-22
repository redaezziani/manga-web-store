import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateVolumeDto, UpdateVolumeDto, AddPreviewImageDto } from './dto/volume.dto';
import { VolumeResponseDto, VolumeListItemDto, PreviewImageDto } from './dto/volume-response.dto';
import { PaginatedResponse } from '../common/utils/pagination.utils';

@Injectable()
export class VolumeService {
  private readonly logger = new Logger(VolumeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createVolumeDto: CreateVolumeDto): Promise<VolumeResponseDto> {
    try {
      // Check if manga exists
      const manga = await this.prisma.manga.findUnique({
        where: { id: createVolumeDto.mangaId }
      });

      if (!manga) {
        throw new NotFoundException('Manga not found');
      }

      // Check if volume number already exists for this manga
      const existingVolume = await this.prisma.volume.findFirst({
        where: {
          mangaId: createVolumeDto.mangaId,
          volumeNumber: createVolumeDto.volumeNumber
        }
      });

      if (existingVolume) {
        throw new ConflictException(`Volume ${createVolumeDto.volumeNumber} already exists for this manga`);
      }

      // Create volume
      const volume = await this.prisma.volume.create({
        data: {
          mangaId: createVolumeDto.mangaId,
          volumeNumber: createVolumeDto.volumeNumber,
          price: createVolumeDto.price,
          discount: createVolumeDto.discount || 0,
          stock: createVolumeDto.stock || 0,
          isAvailable: createVolumeDto.isAvailable ?? true,
        },
        include: {
          manga: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
              isAvailable: true,
            }
          },
          previewImages: true
        }
      });

      this.logger.log(`Volume created: ${volume.id} for manga ${manga.title}`);

      return this.transformVolumeResponse(volume);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Failed to create volume:', error);
      throw new BadRequestException('Failed to create volume');
    }
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    mangaId?: string,
    isAvailable?: boolean,
    minPrice?: number,
    maxPrice?: number,
    inStock?: boolean
  ): Promise<PaginatedResponse<VolumeListItemDto>> {
    try {
      const skip = (page - 1) * limit;
      
      const where: any = {};
      
      if (mangaId) {
        where.mangaId = mangaId;
      }
      
      if (isAvailable !== undefined) {
        where.isAvailable = isAvailable;
        where.manga = { isAvailable: isAvailable };
      }
      
      if (minPrice !== undefined || maxPrice !== undefined) {
        where.price = {};
        if (minPrice !== undefined) where.price.gte = minPrice;
        if (maxPrice !== undefined) where.price.lte = maxPrice;
      }
      
      if (inStock) {
        where.stock = { gt: 0 };
      }

      const [volumes, totalCount] = await Promise.all([
        this.prisma.volume.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { manga: { title: 'asc' } },
            { volumeNumber: 'asc' }
          ],
          include: {
            manga: {
              select: {
                id: true,
                title: true,
                author: true,
                coverImage: true,
                isAvailable: true,
              }
            },
            previewImages: {
              take: 1,
              orderBy: { id: 'asc' }
            }
          }
        }),
        this.prisma.volume.count({ where })
      ]);

      const items = volumes.map(volume => this.transformVolumeListItem(volume));
      
      const totalPages = Math.ceil(totalCount / limit);

      return {
        data: items,
        meta: {
          currentPage: page,
          itemsPerPage: limit,
          totalItems: totalCount,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch volumes:', error);
      throw new BadRequestException('Failed to fetch volumes');
    }
  }

  async findOne(id: string): Promise<VolumeResponseDto> {
    try {
      const volume = await this.prisma.volume.findUnique({
        where: { id },
        include: {
          manga: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
              isAvailable: true,
            }
          },
          previewImages: true
        }
      });

      if (!volume) {
        throw new NotFoundException('Volume not found');
      }

      return this.transformVolumeResponse(volume);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to fetch volume:', error);
      throw new BadRequestException('Failed to fetch volume');
    }
  }

  async findByManga(mangaId: string): Promise<VolumeListItemDto[]> {
    try {
      // Check if manga exists
      const manga = await this.prisma.manga.findUnique({
        where: { id: mangaId }
      });

      if (!manga) {
        throw new NotFoundException('Manga not found');
      }

      const volumes = await this.prisma.volume.findMany({
        where: { mangaId },
        orderBy: { volumeNumber: 'asc' },
        include: {
          manga: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
              isAvailable: true,
            }
          },
          previewImages: {
            take: 1,
            orderBy: { id: 'asc' }
          }
        }
      });

      return volumes.map(volume => this.transformVolumeListItem(volume));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to fetch volumes by manga:', error);
      throw new BadRequestException('Failed to fetch volumes by manga');
    }
  }

  async update(id: string, updateVolumeDto: UpdateVolumeDto): Promise<VolumeResponseDto> {
    try {
      // Check if volume exists
      const existingVolume = await this.prisma.volume.findUnique({
        where: { id }
      });

      if (!existingVolume) {
        throw new NotFoundException('Volume not found');
      }

      // If updating volume number, check for conflicts
      if (updateVolumeDto.volumeNumber) {
        const conflictingVolume = await this.prisma.volume.findFirst({
          where: {
            mangaId: existingVolume.mangaId,
            volumeNumber: updateVolumeDto.volumeNumber,
            id: { not: id }
          }
        });

        if (conflictingVolume) {
          throw new ConflictException(`Volume ${updateVolumeDto.volumeNumber} already exists for this manga`);
        }
      }

      // Update volume
      const volume = await this.prisma.volume.update({
        where: { id },
        data: updateVolumeDto,
        include: {
          manga: {
            select: {
              id: true,
              title: true,
              author: true,
              coverImage: true,
              isAvailable: true,
            }
          },
          previewImages: true
        }
      });

      this.logger.log(`Volume updated: ${volume.id}`);

      return this.transformVolumeResponse(volume);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      this.logger.error('Failed to update volume:', error);
      throw new BadRequestException('Failed to update volume');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      const volume = await this.prisma.volume.findUnique({
        where: { id },
        include: {
          cartItems: true
        }
      });

      if (!volume) {
        throw new NotFoundException('Volume not found');
      }

      // Check if volume is in any cart
      if (volume.cartItems.length > 0) {
        throw new BadRequestException('Cannot delete volume that exists in shopping carts');
      }

      // Delete volume (this will also delete preview images due to cascade)
      await this.prisma.volume.delete({
        where: { id }
      });

      this.logger.log(`Volume deleted: ${id}`);

      return { message: 'Volume deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to delete volume:', error);
      throw new BadRequestException('Failed to delete volume');
    }
  }

  async addPreviewImage(volumeId: string, addPreviewImageDto: AddPreviewImageDto): Promise<PreviewImageDto> {
    try {
      // Check if volume exists
      const volume = await this.prisma.volume.findUnique({
        where: { id: volumeId }
      });

      if (!volume) {
        throw new NotFoundException('Volume not found');
      }

      const previewImage = await this.prisma.previewImage.create({
        data: {
          volumeId,
          url: addPreviewImageDto.url
        }
      });

      this.logger.log(`Preview image added to volume ${volumeId}: ${previewImage.id}`);

      return {
        id: previewImage.id,
        url: previewImage.url
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to add preview image:', error);
      throw new BadRequestException('Failed to add preview image');
    }
  }

  async removePreviewImage(volumeId: string, previewImageId: string): Promise<{ message: string }> {
    try {
      // Check if preview image exists and belongs to the volume
      const previewImage = await this.prisma.previewImage.findFirst({
        where: {
          id: previewImageId,
          volumeId: volumeId
        }
      });

      if (!previewImage) {
        throw new NotFoundException('Preview image not found');
      }

      await this.prisma.previewImage.delete({
        where: { id: previewImageId }
      });

      this.logger.log(`Preview image removed: ${previewImageId}`);

      return { message: 'Preview image removed successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Failed to remove preview image:', error);
      throw new BadRequestException('Failed to remove preview image');
    }
  }

  private transformVolumeResponse(volume: any): VolumeResponseDto {
    const finalPrice = volume.price * (1 - volume.discount);
    
    return {
      id: volume.id,
      volumeNumber: volume.volumeNumber,
      price: volume.price,
      discount: volume.discount,
      finalPrice: Math.round(finalPrice * 100) / 100,
      stock: volume.stock,
      isAvailable: volume.isAvailable,
      createdAt: volume.createdAt,
      updatedAt: volume.updatedAt,
      manga: volume.manga,
      previewImages: volume.previewImages.map(img => ({
        id: img.id,
        url: img.url
      }))
    };
  }

  private transformVolumeListItem(volume: any): VolumeListItemDto {
    const finalPrice = volume.price * (1 - volume.discount);
    
    return {
      id: volume.id,
      volumeNumber: volume.volumeNumber,
      price: volume.price,
      discount: volume.discount,
      finalPrice: Math.round(finalPrice * 100) / 100,
      stock: volume.stock,
      isAvailable: volume.isAvailable,
      manga: volume.manga,
      firstPreviewImage: volume.previewImages.length > 0 ? volume.previewImages[0].url : undefined
    };
  }
}

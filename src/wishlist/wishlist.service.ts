import { 
  Injectable, 
  NotFoundException, 
  ConflictException,
  Logger 
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AddToWishlistDto, RemoveFromWishlistDto } from './dto/wishlist.dto';
import { 
  WishlistResponseDto, 
  WishlistItemDto, 
  WishlistMangaDto,
  WishlistApiResponseDto 
} from './dto/wishlist-response.dto';

@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(private readonly prisma: PrismaService) {}

  async addToWishlist(userId: string, addToWishlistDto: AddToWishlistDto): Promise<WishlistApiResponseDto<WishlistItemDto>> {
    try {
      const { mangaId } = addToWishlistDto;

      // Check if manga exists
      const manga = await this.prisma.manga.findUnique({
        where: { id: mangaId },
        select: { id: true, title: true }
      });

      if (!manga) {
        throw new NotFoundException(`Manga with ID ${mangaId} not found`);
      }

      // Check if already in wishlist
      const existingWishlistItem = await this.prisma.wishlist.findUnique({
        where: {
          userId_mangaId: {
            userId,
            mangaId
          }
        }
      });

      if (existingWishlistItem) {
        throw new ConflictException('Manga is already in wishlist');
      }

      // Add to wishlist
      const wishlistItem = await this.prisma.wishlist.create({
        data: {
          userId,
          mangaId
        },
        include: {
          manga: {
            include: {
              categories: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              },
              volumes: {
                select: {
                  price: true
                }
              }
            }
          }
        }
      });

      const responseItem = this.mapToWishlistItemDto(wishlistItem);

      this.logger.log(`Added manga ${mangaId} to wishlist for user ${userId}`);
      
      return {
        success: true,
        message: 'Item added to wishlist successfully',
        data: responseItem
      };
    } catch (error) {
      this.logger.error(`Error adding to wishlist: ${error.message}`, error.stack);
      throw error;
    }
  }

  async removeFromWishlist(userId: string, removeFromWishlistDto: RemoveFromWishlistDto): Promise<WishlistApiResponseDto<null>> {
    try {
      const { mangaId } = removeFromWishlistDto;

      // Check if item exists in wishlist
      const wishlistItem = await this.prisma.wishlist.findUnique({
        where: {
          userId_mangaId: {
            userId,
            mangaId
          }
        }
      });

      if (!wishlistItem) {
        throw new NotFoundException('Item not found in wishlist');
      }

      // Remove from wishlist
      await this.prisma.wishlist.delete({
        where: {
          userId_mangaId: {
            userId,
            mangaId
          }
        }
      });

      this.logger.log(`Removed manga ${mangaId} from wishlist for user ${userId}`);
      
      return {
        success: true,
        message: 'Item removed from wishlist successfully',
        data: null
      };
    } catch (error) {
      this.logger.error(`Error removing from wishlist: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getWishlist(userId: string): Promise<WishlistApiResponseDto<WishlistResponseDto>> {
    try {
      const wishlistItems = await this.prisma.wishlist.findMany({
        where: { userId },
        include: {
          manga: {
            include: {
              categories: {
                select: {
                  id: true,
                  name: true,
                  slug: true
                }
              },
              volumes: {
                select: {
                  price: true,
                  coverImage: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      const items = wishlistItems.map(item => this.mapToWishlistItemDto(item));

      const response: WishlistResponseDto = {
        items,
        totalCount: items.length
      };

      return {
        success: true,
        message: 'Wishlist retrieved successfully',
        data: response
      };
    } catch (error) {
      this.logger.error(`Error getting wishlist: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getWishlistCount(userId: string): Promise<WishlistApiResponseDto<{ count: number }>> {
    try {
      const count = await this.prisma.wishlist.count({
        where: { userId }
      });

      return {
        success: true,
        message: 'Wishlist count retrieved successfully',
        data: { count }
      };
    } catch (error) {
      this.logger.error(`Error getting wishlist count: ${error.message}`, error.stack);
      throw error;
    }
  }

  async clearWishlist(userId: string): Promise<WishlistApiResponseDto<null>> {
    try {
      await this.prisma.wishlist.deleteMany({
        where: { userId }
      });

      this.logger.log(`Cleared wishlist for user ${userId}`);
      
      return {
        success: true,
        message: 'Wishlist cleared successfully',
        data: null
      };
    } catch (error) {
      this.logger.error(`Error clearing wishlist: ${error.message}`, error.stack);
      throw error;
    }
  }

  async checkIfInWishlist(userId: string, mangaId: string): Promise<WishlistApiResponseDto<{ inWishlist: boolean }>> {
    try {
      const wishlistItem = await this.prisma.wishlist.findUnique({
        where: {
          userId_mangaId: {
            userId,
            mangaId
          }
        }
      });

      return {
        success: true,
        message: 'Wishlist status checked successfully',
        data: { inWishlist: !!wishlistItem }
      };
    } catch (error) {
      this.logger.error(`Error checking wishlist status: ${error.message}`, error.stack);
      throw error;
    }
  }

  private mapToWishlistItemDto(wishlistItem: any): WishlistItemDto {
    const { manga } = wishlistItem;
    
    // Calculate volume count and min price
    const volumeCount = manga.volumes?.length || 0;
    const minPrice = manga.volumes?.length > 0 
      ? Math.min(...manga.volumes.map((v: any) => v.price)) 
      : undefined;

    const wishlistManga: WishlistMangaDto = {
      id: manga.id,
      title: manga.title,
      author: manga.author,
      description: manga.description,
      coverImage: manga.coverImage,
      isAvailable: manga.isAvailable,
      volumeCount,
      minPrice,
      categories: manga.categories || []
    };

    return {
      id: wishlistItem.id,
      createdAt: wishlistItem.createdAt,
      manga: wishlistManga
    };
  }
}

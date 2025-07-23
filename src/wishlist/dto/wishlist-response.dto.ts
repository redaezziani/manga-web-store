import { ApiProperty } from '@nestjs/swagger';

export class WishlistMangaDto {
  @ApiProperty({
    description: 'Manga ID',
    example: 'cm0x1y2z3...',
  })
  id: string;

  @ApiProperty({
    description: 'Manga title',
    example: 'One Piece',
  })
  title: string;

  @ApiProperty({
    description: 'Manga author',
    example: 'Eiichiro Oda',
    required: false,
  })
  author?: string;

  @ApiProperty({
    description: 'Manga description',
    example: 'The story follows the adventures of Monkey D. Luffy...',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Manga cover image URL',
    example: 'https://example.com/cover.jpg',
    required: false,
  })
  coverImage?: string;

  @ApiProperty({
    description: 'Manga availability',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Number of volumes available',
    example: 3,
  })
  volumeCount: number;

  @ApiProperty({
    description: 'Minimum volume price',
    example: 9.99,
    required: false,
  })
  minPrice?: number;

  @ApiProperty({
    description: 'Manga categories',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'cm0x1y2z3...' },
        name: { type: 'string', example: 'Action' },
        slug: { type: 'string', example: 'action' },
      },
    },
  })
  categories: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export class WishlistItemDto {
  @ApiProperty({
    description: 'Wishlist item ID',
    example: 'cm0x1y2z3...',
  })
  id: string;

  @ApiProperty({
    description: 'Date added to wishlist',
    example: '2025-07-23T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Manga information',
    type: WishlistMangaDto,
  })
  manga: WishlistMangaDto;
}

export class WishlistResponseDto {
  @ApiProperty({
    description: 'Wishlist items',
    type: [WishlistItemDto],
  })
  items: WishlistItemDto[];

  @ApiProperty({
    description: 'Total number of items in wishlist',
    example: 5,
  })
  totalCount: number;
}

export class WishlistApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Item added to wishlist successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
  })
  data: T | null;
}

import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the category',
    example: 'cm0x1y2z3...',
  })
  id: string;

  @ApiProperty({
    description: 'Category name in English',
    example: 'Action',
  })
  name: string;

  @ApiProperty({
    description: 'Category name in Arabic',
    example: 'أكشن',
  })
  nameAr: string;

  @ApiProperty({
    description: 'URL-friendly slug for the category',
    example: 'action',
  })
  slug: string;

  @ApiProperty({
    description: 'Category description',
    example: 'High-energy manga with intense fight scenes',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-07-21T15:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-07-21T15:30:00.000Z',
  })
  updatedAt: Date;
}

export class VolumeResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the volume',
    example: 'cm0x1y2z3...',
  })
  id: string;

  @ApiProperty({
    description: 'Volume number in the series',
    example: 1,
  })
  volumeNumber: number;

  @ApiProperty({
    description: 'Price of the volume',
    example: 9.99,
  })
  price: number;

  @ApiProperty({
    description: 'Discount percentage (0-1)',
    example: 0.1,
  })
  discount: number;

  @ApiProperty({
    description: 'Available stock quantity',
    example: 50,
  })
  stock: number;

  @ApiProperty({
    description: 'Whether the volume is available for purchase',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-07-21T15:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-07-21T15:30:00.000Z',
  })
  updatedAt: Date;
}

export class MangaResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the manga',
    example: 'cm0x1y2z3...',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the manga',
    example: 'One Piece',
  })
  title: string;

  @ApiProperty({
    description: 'Author of the manga',
    example: 'Eiichiro Oda',
    required: false,
  })
  author?: string;

  @ApiProperty({
    description: 'Description of the manga',
    example: 'Epic adventure story about pirates...',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'URL of the cover image',
    example: 'https://cloudinary.com/image.jpg',
    required: false,
  })
  coverImage?: string;

  @ApiProperty({
    description: 'Whether the manga is available for purchase',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-07-21T15:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-07-21T15:30:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Categories associated with this manga',
    type: [CategoryResponseDto],
  })
  categories: CategoryResponseDto[];

  @ApiProperty({
    description: 'Volumes available for this manga',
    type: [VolumeResponseDto],
  })
  volumes: VolumeResponseDto[];
}

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
  })
  itemsPerPage: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPreviousPage: boolean;
}

export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Manga retrieved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
  })
  data: T | null;

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
    required: false,
  })
  meta?: PaginationMetaDto;
}

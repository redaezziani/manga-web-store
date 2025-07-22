import { ApiProperty } from '@nestjs/swagger';

export class PreviewImageDto {
  @ApiProperty({
    description: 'Preview image ID',
    example: 'cm0x1y2z3...',
  })
  id: string;

  @ApiProperty({
    description: 'Preview image URL',
    example: 'https://example.com/preview1.jpg',
  })
  url: string;
}

export class VolumeMangaDto {
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
}

export class VolumeResponseDto {
  @ApiProperty({
    description: 'Volume ID',
    example: 'cm0x1y2z3...',
  })
  id: string;

  @ApiProperty({
    description: 'Volume number',
    example: 1,
  })
  volumeNumber: number;

  @ApiProperty({
    description: 'Volume price',
    example: 9.99,
  })
  price: number;

  @ApiProperty({
    description: 'Volume discount (0-1)',
    example: 0.1,
  })
  discount: number;

  @ApiProperty({
    description: 'Final price after discount',
    example: 8.99,
  })
  finalPrice: number;

  @ApiProperty({
    description: 'Available stock',
    example: 50,
  })
  stock: number;

  @ApiProperty({
    description: 'Volume cover image URL',
    example: 'https://example.com/volume-cover.jpg',
    required: false,
  })
  coverImage?: string;

  @ApiProperty({
    description: 'Volume availability',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Volume creation date',
    example: '2025-07-22T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Volume last update date',
    example: '2025-07-22T10:30:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Manga information',
    type: VolumeMangaDto,
  })
  manga: VolumeMangaDto;

  @ApiProperty({
    description: 'Preview images',
    type: [PreviewImageDto],
  })
  previewImages: PreviewImageDto[];
}

export class VolumeListItemDto {
  @ApiProperty({
    description: 'Volume ID',
    example: 'cm0x1y2z3...',
  })
  id: string;

  @ApiProperty({
    description: 'Volume number',
    example: 1,
  })
  volumeNumber: number;

  @ApiProperty({
    description: 'Volume price',
    example: 9.99,
  })
  price: number;

  @ApiProperty({
    description: 'Volume discount (0-1)',
    example: 0.1,
  })
  discount: number;

  @ApiProperty({
    description: 'Final price after discount',
    example: 8.99,
  })
  finalPrice: number;

  @ApiProperty({
    description: 'Available stock',
    example: 50,
  })
  stock: number;

  @ApiProperty({
    description: 'Volume cover image URL',
    example: 'https://example.com/volume-cover.jpg',
    required: false,
  })
  coverImage?: string;

  @ApiProperty({
    description: 'Volume availability',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Manga information',
    type: VolumeMangaDto,
  })
  manga: VolumeMangaDto;

  @ApiProperty({
    description: 'First preview image URL',
    example: 'https://example.com/preview1.jpg',
    required: false,
  })
  firstPreviewImage?: string;
}

export class VolumeApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Volume created successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
  })
  data: T | null;
}

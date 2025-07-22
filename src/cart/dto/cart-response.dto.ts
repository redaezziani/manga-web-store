import { ApiProperty } from '@nestjs/swagger';

export class CartVolumeDto {
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
    description: 'Available stock',
    example: 50,
  })
  stock: number;

  @ApiProperty({
    description: 'Volume availability',
    example: true,
  })
  isAvailable: boolean;

  @ApiProperty({
    description: 'Final price after discount',
    example: 8.99,
  })
  finalPrice: number;

  @ApiProperty({
    description: 'Manga information',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'cm0x1y2z3...' },
      title: { type: 'string', example: 'One Piece' },
      author: { type: 'string', example: 'Eiichiro Oda' },
      coverImage: { type: 'string', example: 'https://example.com/cover.jpg' },
    },
  })
  manga: {
    id: string;
    title: string;
    author?: string;
    coverImage?: string;
  };
}

export class CartItemDto {
  @ApiProperty({
    description: 'Cart item ID',
    example: 'cm0x1y2z3...',
  })
  id: string;

  @ApiProperty({
    description: 'Quantity in cart',
    example: 2,
  })
  quantity: number;

  @ApiProperty({
    description: 'Item subtotal (quantity × final price)',
    example: 17.98,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Volume information',
    type: CartVolumeDto,
  })
  volume: CartVolumeDto;

  @ApiProperty({
    description: 'Date added to cart',
    example: '2025-07-22T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2025-07-22T10:30:00.000Z',
  })
  updatedAt: Date;
}

export class CartSummaryDto {
  @ApiProperty({
    description: 'Total number of items in cart',
    example: 3,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Total number of unique volumes',
    example: 2,
  })
  uniqueItems: number;

  @ApiProperty({
    description: 'Subtotal before discounts',
    example: 29.97,
  })
  subtotal: number;

  @ApiProperty({
    description: 'Total discount amount',
    example: 2.99,
  })
  totalDiscount: number;

  @ApiProperty({
    description: 'Total amount to pay',
    example: 26.98,
  })
  total: number;
}

export class CartResponseDto {
  @ApiProperty({
    description: 'Cart ID',
    example: 'cm0x1y2z3...',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: 'cm0x1y2z3...',
  })
  userId: string;

  @ApiProperty({
    description: 'Cart items',
    type: [CartItemDto],
  })
  items: CartItemDto[];

  @ApiProperty({
    description: 'Cart summary',
    type: CartSummaryDto,
  })
  summary: CartSummaryDto;

  @ApiProperty({
    description: 'Cart creation date',
    example: '2025-07-22T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Cart last update date',
    example: '2025-07-22T10:30:00.000Z',
  })
  updatedAt: Date;
}

export class CartApiResponseDto<T = any> {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Item added to cart successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response data',
  })
  data: T | null;
}

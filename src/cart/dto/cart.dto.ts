import { IsString, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty({
    description: 'Volume ID to add to cart',
    example: 'cm0x1y2z3...',
  })
  @IsString()
  volumeId: string;

  @ApiProperty({
    description: 'Quantity of the volume',
    example: 2,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity?: number = 1;
}

export class UpdateCartItemDto {
  @ApiProperty({
    description: 'Cart item ID to update',
    example: 'cm0x1y2z3...',
  })
  @IsString()
  cartItemId: string;

  @ApiProperty({
    description: 'New quantity for the cart item',
    example: 3,
    minimum: 1,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;
}

export class RemoveFromCartDto {
  @ApiProperty({
    description: 'Cart item ID to remove',
    example: 'cm0x1y2z3...',
  })
  @IsString()
  cartItemId: string;
}

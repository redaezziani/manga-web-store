import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToWishlistDto {
  @ApiProperty({
    description: 'Manga ID to add to wishlist',
    example: 'cm0x1y2z3...',
  })
  @IsString()
  mangaId: string;
}

export class RemoveFromWishlistDto {
  @ApiProperty({
    description: 'Manga ID to remove from wishlist',
    example: 'cm0x1y2z3...',
  })
  @IsString()
  mangaId: string;
}

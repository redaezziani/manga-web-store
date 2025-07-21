import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMangaDto {
  @ApiProperty({
    description: 'Title of the manga',
    example: 'One Piece Updated',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Author of the manga',
    example: 'Eiichiro Oda',
    required: false,
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({
    description: 'Description of the manga story and plot',
    example: 'Updated epic adventure story about pirates searching for the ultimate treasure.',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'URL of the manga cover image',
    example: 'https://example.com/covers/one-piece-updated.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({
    description: 'Whether the manga is available for purchase',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
  })
  isAvailable?: boolean;

  @ApiProperty({
    description: 'Array of category IDs to associate with the manga',
    example: ['category-id-1', 'category-id-3'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    // If already an array, return it
    if (Array.isArray(value)) return value;

    // If comma-separated string, split it
    if (typeof value === 'string') {
      try {
        // Try parsing JSON array string first (e.g. '["a","b"]')
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        // Otherwise split by commas
        return value.split(',').map((v) => v.trim());
      }
    }

    return [];
  })
  categoryIds?: string[];
}

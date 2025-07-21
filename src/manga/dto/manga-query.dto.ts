import { IsOptional, IsString, IsBoolean, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class MangaQueryDto extends PaginationDto {
  @ApiProperty({
    description: 'Search term to filter manga by title, author, description, or categories',
    example: 'One Piece',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by author name',
    example: 'Eiichiro Oda',
    required: false,
  })
  @IsOptional()
  @IsString()
  author?: string;

  @ApiProperty({
    description: 'Filter by availability status',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return undefined;
  })
  isAvailable?: boolean;

  @ApiProperty({
    description: 'Filter by category slugs',
    example: ['action', 'adventure'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value.split(',').map((v) => v.trim());
    }
    return [];
  })
  categories?: string[];

  @ApiProperty({
    description: 'Sort field for manga results',
    example: 'title',
    enum: ['title', 'author', 'createdAt', 'updatedAt'],
    required: false,
  })
  @IsOptional()
  @IsString()
  sortBy?: 'title' | 'author' | 'createdAt' | 'updatedAt';
}

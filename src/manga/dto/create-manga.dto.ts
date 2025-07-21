import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMangaDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
  })
  isAvailable?: boolean = true;

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

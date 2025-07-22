import { IsString, IsInt, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateVolumeDto {
  @ApiProperty({
    description: 'Manga ID this volume belongs to',
    example: 'cm0x1y2z3...',
  })
  @IsString()
  mangaId: string;

  @ApiProperty({
    description: 'Volume number',
    example: 1,
    minimum: 1,
  })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1, { message: 'Volume number must be at least 1' })
  volumeNumber: number;

  @ApiProperty({
    description: 'Volume price',
    example: 9.99,
    minimum: 0,
  })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'Price must be at least 0' })
  price: number;

  @ApiProperty({
    description: 'Discount percentage (0-1)',
    example: 0.1,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Discount must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'Discount must be at least 0' })
  @Max(1, { message: 'Discount must be at most 1' })
  discount?: number = 0;

  @ApiProperty({
    description: 'Stock quantity',
    example: 50,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0, { message: 'Stock must be at least 0' })
  stock?: number = 0;

  @ApiProperty({
    description: 'Volume cover image URL',
    example: 'https://example.com/volume-cover.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({
    description: 'Volume availability',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean = true;
}

export class UpdateVolumeDto {
  @ApiProperty({
    description: 'Volume number',
    example: 1,
    minimum: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1, { message: 'Volume number must be at least 1' })
  volumeNumber?: number;

  @ApiProperty({
    description: 'Volume price',
    example: 9.99,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Price must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'Price must be at least 0' })
  price?: number;

  @ApiProperty({
    description: 'Discount percentage (0-1)',
    example: 0.1,
    minimum: 0,
    maximum: 1,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Discount must be a valid number with up to 2 decimal places' })
  @Min(0, { message: 'Discount must be at least 0' })
  @Max(1, { message: 'Discount must be at most 1' })
  discount?: number;

  @ApiProperty({
    description: 'Stock quantity',
    example: 50,
    minimum: 0,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(0, { message: 'Stock must be at least 0' })
  stock?: number;

  @ApiProperty({
    description: 'Volume cover image URL',
    example: 'https://example.com/volume-cover.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiProperty({
    description: 'Volume availability',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}

export class AddPreviewImageDto {
  @ApiProperty({
    description: 'Preview image URL',
    example: 'https://example.com/preview1.jpg',
  })
  @IsString()
  url: string;
}

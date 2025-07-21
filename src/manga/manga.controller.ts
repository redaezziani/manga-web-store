import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { MangaService } from './manga.service';
import {
  CreateMangaDto,
  MangaQueryDto,
} from './dto';
import { CloudinaryService } from '../storage/cloudinary.service';

@ApiTags('Manga')
@Controller({
  path: 'manga',
  version: '1',
})
export class MangaController {
  constructor(
    private readonly mangaService: MangaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('coverImage'))
  async create(
    @Body() createMangaDto: CreateMangaDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ) {
    try {
      // Upload cover image if provided
      if (coverImage) {
        const uploadResult = await this.cloudinaryService.uploadFile(
          coverImage,
          'manga-covers',
        );

        console.log('Cover image uploaded:', uploadResult);
        createMangaDto.coverImage = uploadResult.secure_url;
      }

      const manga = await this.mangaService.create(createMangaDto);

      return {
        success: true,
        message: 'Manga created successfully',
        data: manga,
      };
    } catch (error) {
      console.error('Error creating manga:', error);
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get()
  async findAll(@Query() queryDto: MangaQueryDto) {
    try {
      const result = await this.mangaService.findAll(queryDto);

      return {
        success: true,
        message: 'Mangas retrieved successfully',
        data: result.data,
        meta: result.meta,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        meta: null,
      };
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const manga = await this.mangaService.findOne(id);

      return {
        success: true,
        message: 'Manga retrieved successfully',
        data: manga,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('categories')
  async getCategories() {
    try {
      const categories = await this.mangaService.getAllCategories();

      return {
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }
}

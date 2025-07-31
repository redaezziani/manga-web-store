import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  ParseFloatPipe,
  ParseBoolPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { VolumeService } from './volume.service';
import {
  CreateVolumeDto,
  UpdateVolumeDto,
  AddPreviewImageDto,
  CreateVolumeData,
  UpdateVolumeData,
} from './dto/volume.dto';
import {
  VolumeResponseDto,
  VolumeListItemDto,
  VolumeApiResponseDto,
  PreviewImageDto,
  FilterDataResponseDto,
} from './dto/volume-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginatedResponse } from '../common/utils/pagination.utils';
import { CloudinaryService } from '../storage/cloudinary.service';

@Controller('volumes')
@ApiTags('Volumes')
export class VolumeController {
  constructor(
    private readonly volumeService: VolumeService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
   @Get('most-ordered')
  async getMostOrderedVolumes(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<VolumeApiResponseDto<VolumeListItemDto[]>> {
    try {
      const mostOrderedVolumes = await this.volumeService.getMostOrderedVolumes(
        limit,
      );
      return {
        success: true,
        message: 'Most ordered volumes retrieved successfully',
        data: mostOrderedVolumes,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  
  @Get('low-stock')
  async getLowStockVolumes(
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<VolumeApiResponseDto<VolumeListItemDto[]>> {
    try {
      const lowStockVolumes = await this.volumeService.getLowStockVolumes(limit);
      return {
        success: true,
        message: 'Low stock volumes retrieved successfully',
        data: lowStockVolumes,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }
  @Post()
  //   @UseGuards(JwtAuthGuard)
  //   @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('coverImageFile'))
  async create(
    @Body() createVolumeDto: CreateVolumeDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ): Promise<VolumeApiResponseDto<VolumeResponseDto>> {
    try {
      // Prepare data for service with cover image URL if provided
      const volumeData: CreateVolumeData = { ...createVolumeDto };

      // Upload cover image if provided
      if (coverImage) {
        const uploadResult = await this.cloudinaryService.uploadFile(
          coverImage,
          'volume-covers',
        );

        console.log('Volume cover image uploaded:', uploadResult);
        volumeData.coverImage = uploadResult.secure_url;
      }

      const volume = await this.volumeService.create(volumeData);
      return {
        success: true,
        message: 'Volume created successfully',
        data: volume,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('filter-data')
  async getFilterData(): Promise<VolumeApiResponseDto<FilterDataResponseDto>> {
    try {
      const filterData = await this.volumeService.getFilterData();

      return {
        success: true,
        message: 'Filter data retrieved successfully',
        data: filterData,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('mangaId') mangaId?: string,
    @Query('isAvailable') isAvailable?: boolean,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStock') inStock?: boolean,
    @Query('authors') authors?: string | string[],
    @Query('categories') categories?: string | string[],
  ): Promise<VolumeApiResponseDto<PaginatedResponse<VolumeListItemDto>>> {
    try {
      // Parse numeric parameters safely
      const parsedMinPrice =
        minPrice && !isNaN(parseFloat(minPrice))
          ? parseFloat(minPrice)
          : undefined;
      const parsedMaxPrice =
        maxPrice && !isNaN(parseFloat(maxPrice))
          ? parseFloat(maxPrice)
          : undefined;

      // Handle authors parameter - can be a single string or array of strings
      const authorsArray = authors
        ? Array.isArray(authors)
          ? authors
          : [authors]
        : undefined;

      // Handle categories parameter - can be a single string or array of strings
      const categoriesArray = categories
        ? Array.isArray(categories)
          ? categories
          : [categories]
        : undefined;

      const volumes = await this.volumeService.findAll(
        page,
        limit,
        mangaId,
        isAvailable,
        parsedMinPrice,
        parsedMaxPrice,
        inStock,
        authorsArray,
        categoriesArray,
      );

      return {
        success: true,
        message: 'Volumes retrieved successfully',
        data: volumes,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get('manga/:mangaId')
  async findByManga(
    @Param('mangaId') mangaId: string,
  ): Promise<VolumeApiResponseDto<VolumeListItemDto[]>> {
    try {
      const volumes = await this.volumeService.findByManga(mangaId);
      return {
        success: true,
        message: 'Volumes retrieved successfully',
        data: volumes,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<VolumeApiResponseDto<VolumeResponseDto>> {
    try {
      const volume = await this.volumeService.findOne(id);
      return {
        success: true,
        message: 'Volume retrieved successfully',
        data: volume,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Update volume',
    description: 'Update a manga volume with optional cover image (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Volume ID',
    example: 'cm0x1y2z3...',
  })
  @ApiBody({ type: UpdateVolumeDto })
  @ApiResponse({
    status: 200,
    description: 'Volume updated successfully',
    type: VolumeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Volume not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Volume number already exists for this manga',
  })
  @UseInterceptors(FileInterceptor('coverImageFile'))
  async update(
    @Param('id') id: string,
    @Body() updateVolumeDto: UpdateVolumeDto,
    @UploadedFile() coverImage?: Express.Multer.File,
  ): Promise<VolumeApiResponseDto<VolumeResponseDto>> {
    try {
      // Prepare data for service with cover image URL if provided
      const volumeData: UpdateVolumeData = { ...updateVolumeDto };

      // Upload cover image if provided
      if (coverImage) {
        const uploadResult = await this.cloudinaryService.uploadFile(
          coverImage,
          'volume-covers',
        );

        console.log('Volume cover image uploaded for update:', uploadResult);
        volumeData.coverImage = uploadResult.secure_url;
      }

      const volume = await this.volumeService.update(id, volumeData);
      return {
        success: true,
        message: 'Volume updated successfully',
        data: volume,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete volume',
    description: 'Delete a manga volume (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Volume ID',
    example: 'cm0x1y2z3...',
  })
  @ApiResponse({
    status: 200,
    description: 'Volume deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Volume deleted successfully' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Volume deleted successfully' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete volume that exists in shopping carts',
  })
  @ApiResponse({
    status: 404,
    description: 'Volume not found',
  })
  async remove(
    @Param('id') id: string,
  ): Promise<VolumeApiResponseDto<{ message: string }>> {
    try {
      const result = await this.volumeService.remove(id);
      return {
        success: true,
        message: 'Volume deleted successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Post(':id/preview-images')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add preview image',
    description: 'Add a preview image to a volume (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Volume ID',
    example: 'cm0x1y2z3...',
  })
  @ApiBody({ type: AddPreviewImageDto })
  @ApiResponse({
    status: 201,
    description: 'Preview image added successfully',
    type: PreviewImageDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Volume not found',
  })
  @HttpCode(HttpStatus.CREATED)
  async addPreviewImage(
    @Param('id') volumeId: string,
    @Body() addPreviewImageDto: AddPreviewImageDto,
  ): Promise<VolumeApiResponseDto<PreviewImageDto>> {
    try {
      const previewImage = await this.volumeService.addPreviewImage(
        volumeId,
        addPreviewImageDto,
      );
      return {
        success: true,
        message: 'Preview image added successfully',
        data: previewImage,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Delete(':id/preview-images/:previewImageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove preview image',
    description: 'Remove a preview image from a volume (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Volume ID',
    example: 'cm0x1y2z3...',
  })
  @ApiParam({
    name: 'previewImageId',
    description: 'Preview image ID',
    example: 'cm0x1y2z3...',
  })
  @ApiResponse({
    status: 200,
    description: 'Preview image removed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Preview image removed successfully',
        },
        data: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Preview image removed successfully',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Preview image not found',
  })
  async removePreviewImage(
    @Param('id') volumeId: string,
    @Param('previewImageId') previewImageId: string,
  ): Promise<VolumeApiResponseDto<{ message: string }>> {
    try {
      const result = await this.volumeService.removePreviewImage(
        volumeId,
        previewImageId,
      );
      return {
        success: true,
        message: 'Preview image removed successfully',
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
      };
    }
  }

  @Get(':id/related')
  
  async getRelatedVolumes(
    @Param('id') volumeId: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<VolumeApiResponseDto<VolumeListItemDto[]>> {
    try {
      const relatedVolumes = await this.volumeService.getRelatedVolumes(
        volumeId,
        limit,
      );
      return {
        success: true,
        message: 'Related volumes retrieved successfully',
        data: relatedVolumes,
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

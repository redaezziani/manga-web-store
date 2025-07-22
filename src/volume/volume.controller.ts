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
import { CreateVolumeDto, UpdateVolumeDto, AddPreviewImageDto, CreateVolumeData, UpdateVolumeData } from './dto/volume.dto';
import { 
  VolumeResponseDto, 
  VolumeListItemDto, 
  VolumeApiResponseDto,
  PreviewImageDto 
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

  @Post()
//   @UseGuards(JwtAuthGuard)
//   @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Create volume',
    description: 'Create a new manga volume with optional cover image (Admin only)',
  })
  @ApiBody({ type: CreateVolumeDto })
  @ApiResponse({
    status: 201,
    description: 'Volume created successfully',
    type: VolumeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid data',
  })
  @ApiResponse({
    status: 404,
    description: 'Manga not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Volume number already exists for this manga',
  })
  @HttpCode(HttpStatus.CREATED)
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

  @Get()
  @ApiOperation({
    summary: 'Get all volumes',
    description: 'Get a paginated list of manga volumes with optional filtering',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
    example: 20,
  })
  @ApiQuery({
    name: 'mangaId',
    required: false,
    type: String,
    description: 'Filter by manga ID',
  })
  @ApiQuery({
    name: 'isAvailable',
    required: false,
    type: Boolean,
    description: 'Filter by availability',
  })
  @ApiQuery({
    name: 'minPrice',
    required: false,
    type: Number,
    description: 'Minimum price filter',
  })
  @ApiQuery({
    name: 'maxPrice',
    required: false,
    type: Number,
    description: 'Maximum price filter',
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    type: Boolean,
    description: 'Filter only volumes in stock',
  })
  @ApiResponse({
    status: 200,
    description: 'Volumes retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Volumes retrieved successfully' },
        data: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/VolumeListItemDto' },
            },
            meta: {
              type: 'object',
              properties: {
                currentPage: { type: 'number', example: 1 },
                itemsPerPage: { type: 'number', example: 20 },
                totalItems: { type: 'number', example: 100 },
                totalPages: { type: 'number', example: 5 },
                hasNextPage: { type: 'boolean', example: true },
                hasPreviousPage: { type: 'boolean', example: false },
              },
            },
          },
        },
      },
    },
  })
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('mangaId') mangaId?: string,
    @Query('isAvailable') isAvailable?: boolean,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('inStock') inStock?: boolean,
  ): Promise<VolumeApiResponseDto<PaginatedResponse<VolumeListItemDto>>> {
    try {
      // Parse numeric parameters safely
      const parsedMinPrice = minPrice && !isNaN(parseFloat(minPrice)) ? parseFloat(minPrice) : undefined;
      const parsedMaxPrice = maxPrice && !isNaN(parseFloat(maxPrice)) ? parseFloat(maxPrice) : undefined;
      
      const volumes = await this.volumeService.findAll(
        page,
        limit,
        mangaId,
        isAvailable,
        parsedMinPrice,
        parsedMaxPrice,
        inStock,
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
  @ApiOperation({
    summary: 'Get volumes by manga',
    description: 'Get all volumes for a specific manga',
  })
  @ApiParam({
    name: 'mangaId',
    description: 'Manga ID',
    example: 'cm0x1y2z3...',
  })
  @ApiResponse({
    status: 200,
    description: 'Volumes retrieved successfully',
    type: [VolumeListItemDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Manga not found',
  })
  async findByManga(@Param('mangaId') mangaId: string): Promise<VolumeApiResponseDto<VolumeListItemDto[]>> {
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
  @ApiOperation({
    summary: 'Get volume by ID',
    description: 'Get detailed information about a specific volume',
  })
  @ApiParam({
    name: 'id',
    description: 'Volume ID',
    example: 'cm0x1y2z3...',
  })
  @ApiResponse({
    status: 200,
    description: 'Volume retrieved successfully',
    type: VolumeResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Volume not found',
  })
  async findOne(@Param('id') id: string): Promise<VolumeApiResponseDto<VolumeResponseDto>> {
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
  async remove(@Param('id') id: string): Promise<VolumeApiResponseDto<{ message: string }>> {
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
      const previewImage = await this.volumeService.addPreviewImage(volumeId, addPreviewImageDto);
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
        message: { type: 'string', example: 'Preview image removed successfully' },
        data: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Preview image removed successfully' },
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
      const result = await this.volumeService.removePreviewImage(volumeId, previewImageId);
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
}
